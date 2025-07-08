import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ServerConnection {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}

interface LogCommand {
    type: 'command' | 'file';
    value: string;
    follow?: boolean;
}

interface LogEntry {
    sessionId: string;
    data: string;
    timestamp: Date;
}

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeSession, setActiveSession] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:8000', {
            withCredentials: true
        });

        newSocket.on('connect', () => {
            setConnectionStatus('connected');
            console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
            setConnectionStatus('disconnected');
            console.log('Disconnected from server');
        });

        newSocket.on('log-data', (data: LogEntry) => {
            setLogs(prev => [...prev, data]);
        });

        newSocket.on('log-stream-ended', (data: { sessionId: string }) => {
            console.log('Log stream ended:', data.sessionId);
        });

        newSocket.on('log-stream-stopped', (data: { sessionId: string }) => {
            console.log('Log stream stopped:', data.sessionId);
            setActiveSession(null);
        });

        newSocket.on('log-stream-error', (data: { sessionId: string, error: string }) => {
            console.error('Log stream error:', data.error);
            setActiveSession(null);
        });

        newSocket.on('server-connected', (data: { connectionId: string }) => {
            console.log('Server connected:', data.connectionId);
        });

        newSocket.on('server-disconnected', (data: { connectionId: string }) => {
            console.log('Server disconnected:', data.connectionId);
        });

        newSocket.on('server-connection-error', (data: { connectionId: string, error: string }) => {
            console.error('Server connection error:', data.error);
        });

        setSocket(newSocket);
        socketRef.current = newSocket;

        return () => {
            newSocket.close();
        };
    }, []);

    const testConnection = async (connection: ServerConnection): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!socketRef.current) {
                resolve(false);
                return;
            }

            const timeout = setTimeout(() => {
                resolve(false);
            }, 10000); // 10 second timeout

            socketRef.current.once('connection-test-result', (result: { success: boolean, connectionId: string, error?: string }) => {
                clearTimeout(timeout);
                if (result.error) {
                    console.error('Connection test error:', result.error);
                }
                resolve(result.success);
            });

            socketRef.current.emit('test-connection', connection);
        });
    };

    const connectToServer = async (connection: ServerConnection): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 15000); // 15 second timeout

            socketRef.current.once('server-connected', () => {
                clearTimeout(timeout);
                resolve();
            });

            socketRef.current.once('server-connection-error', (data: { connectionId: string, error: string }) => {
                clearTimeout(timeout);
                reject(new Error(data.error));
            });

            socketRef.current.emit('connect-server', connection);
        });
    };

    const disconnectFromServer = async (connectionId: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!socketRef.current) {
                resolve();
                return;
            }

            socketRef.current.once('server-disconnected', () => {
                resolve();
            });

            socketRef.current.emit('disconnect-server', connectionId);
        });
    };

    const startLogStream = (connectionId: string, command: LogCommand): void => {
        if (!socketRef.current) {
            console.error('Socket not connected');
            return;
        }

        const sessionId = `${connectionId}-${Date.now()}`;
        setActiveSession(sessionId);

        socketRef.current.emit('start-log-stream', {
            connectionId,
            command
        });
    };

    const stopLogStream = (sessionId?: string): void => {
        if (!socketRef.current) {
            return;
        }

        const targetSession = sessionId || activeSession;
        if (targetSession) {
            socketRef.current.emit('stop-log-stream', targetSession);
            setActiveSession(null);
        }
    };

    const clearLogs = (): void => {
        setLogs([]);
    };

    const downloadLogs = async (connectionId: string, command: LogCommand, format: 'txt' | 'json' = 'txt'): Promise<void> => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'}/api/servers/download-logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    connectionId,
                    command,
                    format
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `logs-${connectionId}-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    };

    return {
        socket,
        connectionStatus,
        logs,
        activeSession,
        testConnection,
        connectToServer,
        disconnectFromServer,
        startLogStream,
        stopLogStream,
        clearLogs,
        downloadLogs
    };
}; 