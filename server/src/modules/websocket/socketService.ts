import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { sshService, ServerConnection, LogCommand } from '../ssh/sshService';

export interface LogSession {
    id: string;
    connectionId: string;
    command: LogCommand;
    active: boolean;
    socketId: string;
}

export class SocketService {
    private io: Server;
    private activeSessions: Map<string, LogSession> = new Map();

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.setupEventHandlers();
        this.setupSSHEventHandlers();
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            // Test server connection
            socket.on('test-connection', async (connection: ServerConnection) => {
                try {
                    const isConnected = await sshService.testConnection(connection);
                    socket.emit('connection-test-result', {
                        success: isConnected,
                        connectionId: connection.id
                    });
                } catch (error) {
                    socket.emit('connection-test-result', {
                        success: false,
                        connectionId: connection.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            // Connect to server
            socket.on('connect-server', async (connection: ServerConnection) => {
                try {
                    await sshService.connectToServer(connection);
                    socket.emit('server-connected', { connectionId: connection.id });
                } catch (error) {
                    socket.emit('server-connection-error', {
                        connectionId: connection.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            // Start log streaming
            socket.on('start-log-stream', async (data: { connectionId: string, command: LogCommand }) => {
                const sessionId = `${data.connectionId}-${Date.now()}`;

                const session: LogSession = {
                    id: sessionId,
                    connectionId: data.connectionId,
                    command: data.command,
                    active: true,
                    socketId: socket.id
                };

                this.activeSessions.set(sessionId, session);

                try {
                    if (data.command.follow) {
                        // For streaming logs (like docker logs -f)
                        await sshService.executeLogCommand(
                            data.connectionId,
                            data.command,
                            (logData) => {
                                if (session.active) {
                                    socket.emit('log-data', {
                                        sessionId,
                                        data: logData,
                                        timestamp: new Date()
                                    });
                                }
                            }
                        );
                    } else {
                        // For one-time log retrieval - handle both callback and final result
                        console.log(`Executing non-streaming command: ${data.command.value}`);
                        let callbackDataReceived = false;
                        
                        const logData = await sshService.executeLogCommand(
                            data.connectionId,
                            data.command,
                            (partialData) => {
                                if (session.active) {
                                    console.log(`Sending callback data: ${partialData.trim()}`);
                                    callbackDataReceived = true;
                                    socket.emit('log-data', {
                                        sessionId,
                                        data: partialData,
                                        timestamp: new Date()
                                    });
                                }
                            }
                        );

                        // If we have additional data from the resolved promise and didn't get it via callback, send it
                        if (typeof logData === 'string' && logData.trim() && session.active && !callbackDataReceived) {
                            console.log(`Sending resolved data: ${logData.trim()}`);
                            // Split into lines and send each as separate log entry
                            const lines = logData.split('\n').filter(line => line.trim());
                            for (const line of lines) {
                                if (session.active) {
                                    socket.emit('log-data', {
                                        sessionId,
                                        data: line + '\n',
                                        timestamp: new Date()
                                    });
                                }
                            }
                        }

                        // small delay to ensure data is sent before closing session
                        setTimeout(() => {
                            if (session.active) {
                                console.log(`Ending session: ${sessionId}`);
                                socket.emit('log-stream-ended', { sessionId });
                                session.active = false;
                                this.activeSessions.delete(sessionId);
                            }
                        }, 100);
                    }
                } catch (error) {
                    socket.emit('log-stream-error', {
                        sessionId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    session.active = false;
                    this.activeSessions.delete(sessionId);
                }
            });

            // Stop log streaming
            socket.on('stop-log-stream', (sessionId: string) => {
                const session = this.activeSessions.get(sessionId);
                if (session) {
                    session.active = false;
                    this.activeSessions.delete(sessionId);
                    socket.emit('log-stream-stopped', { sessionId });
                }
            });

            // Get log file content
            socket.on('get-log-file', async (data: { connectionId: string, filePath: string }) => {
                try {
                    const content = await sshService.readLogFile(data.connectionId, data.filePath);
                    socket.emit('log-file-content', {
                        filePath: data.filePath,
                        content,
                        timestamp: new Date()
                    });
                } catch (error) {
                    socket.emit('log-file-error', {
                        filePath: data.filePath,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            // Disconnect from server
            socket.on('disconnect-server', (connectionId: string) => {
                sshService.disconnect(connectionId);
                // Stop all active sessions for this connection
                for (const [sessionId, session] of this.activeSessions) {
                    if (session.connectionId === connectionId) {
                        session.active = false;
                        this.activeSessions.delete(sessionId);
                        socket.emit('log-stream-stopped', { sessionId });
                    }
                }
                socket.emit('server-disconnected', { connectionId });
            });

            // Get active connections
            socket.on('get-active-connections', () => {
                const connections = sshService.getActiveConnections();
                socket.emit('active-connections', connections);
            });

            // Handle client disconnect
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
                // Stop all sessions for this socket
                for (const [sessionId, session] of this.activeSessions) {
                    if (session.socketId === socket.id) {
                        session.active = false;
                        this.activeSessions.delete(sessionId);
                    }
                }
            });
        });
    }

    private setupSSHEventHandlers(): void {
        // Forward SSH service events to connected clients
        sshService.on('connected', (connectionId: string) => {
            this.io.emit('server-connected', { connectionId });
        });

        sshService.on('disconnected', (connectionId: string) => {
            this.io.emit('server-disconnected', { connectionId });
            // Stop all sessions for this connection
            for (const [sessionId, session] of this.activeSessions) {
                if (session.connectionId === connectionId) {
                    session.active = false;
                    this.activeSessions.delete(sessionId);
                    this.io.emit('log-stream-stopped', { sessionId });
                }
            }
        });

        sshService.on('error', (data: { connectionId: string, error: string }) => {
            this.io.emit('server-error', data);
        });

        sshService.on('logData', (data: { connectionId: string, data: string, timestamp: Date }) => {
            // This is handled in the executeLogCommand callback above
        });

        sshService.on('logError', (data: { connectionId: string, error: string, timestamp: Date }) => {
            this.io.emit('log-error', data);
        });

        sshService.on('commandError', (data: { connectionId: string, code: number, signal: string }) => {
            this.io.emit('command-error', data);
        });
    }

    // Broadcast to all connected clients
    broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }

    // Send to specific socket
    sendToSocket(socketId: string, event: string, data: any): void {
        this.io.to(socketId).emit(event, data);
    }

    // Get active sessions count
    getActiveSessionsCount(): number {
        return this.activeSessions.size;
    }

    // Get active sessions for a connection
    getSessionsForConnection(connectionId: string): LogSession[] {
        return Array.from(this.activeSessions.values()).filter(
            session => session.connectionId === connectionId
        );
    }
}

export let socketService: SocketService; 