/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';

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
        });

        newSocket.on('disconnect', () => {
            setConnectionStatus('disconnected');
        });

        newSocket.on('log-data', (data: LogEntry) => {
            setLogs(prev => [...prev, data]);
        });

        newSocket.on('log-stream-ended', () => {
        });

        newSocket.on('log-stream-stopped', () => {
            setActiveSession(null);
        });

        newSocket.on('log-stream-error', (data: { sessionId: string, error: string }) => {
            console.error('Log stream error:', data.error);
            setActiveSession(null);
            
            setLogs(prev => [...prev, {
                sessionId: data.sessionId,
                data: `STREAM ERROR: ${data.error}`,
                timestamp: new Date()
            } as LogEntry]);
        });

        newSocket.on('server-connected', () => {
        });

        newSocket.on('server-disconnected', () => {
        });

        newSocket.on('server-connection-error', (data: { connectionId: string, error: string }) => {
            console.error('Server connection error:', data.error);
        });

        newSocket.on('log-error', (data: { connectionId: string, error: string, timestamp: Date }) => {
            console.warn('Log stderr:', data.error);
            setLogs(prev => [...prev, {
                sessionId: `error-${data.connectionId}-${Date.now()}`,
                data: `ERROR: ${data.error}`,
                timestamp: new Date(data.timestamp)
            } as LogEntry]);
        });

        newSocket.on('server-error', (data: { connectionId: string, error: string }) => {
            console.error('Server error:', data.error);
            setLogs(prev => [...prev, {
                sessionId: `server-error-${data.connectionId}-${Date.now()}`,
                data: `SERVER ERROR: ${data.error}`,
                timestamp: new Date()
            } as LogEntry]);
        });

        newSocket.on('command-error', (data: { connectionId: string, code: number, signal: string }) => {
            console.warn('Command exited with error:', { code: data.code, signal: data.signal });
            if (data.code !== 0 && data.code !== null) {
                setLogs(prev => [...prev, {
                    sessionId: `cmd-error-${data.connectionId}-${Date.now()}`,
                    data: `COMMAND EXITED: code=${data.code}, signal=${data.signal}`,
                    timestamp: new Date()
                } as LogEntry]);
            }
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
            }, 10000);

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
            }, 15000);

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

    const downloadLogs = async (
        connectionId: string,
        command: LogCommand,
        format: 'txt' | 'json' = 'txt',
        onProgress?: (progress: number) => void
    ): Promise<void> => {
        const maxRetries = 3;
        let attempt = 0;

        const attemptDownload = async (): Promise<void> => {
            try {
                const abortController = new AbortController();

                const timeoutId = setTimeout(() => {
                    abortController.abort();
                }, 300000);

                const response = await api.post('/servers/download-logs', {
                    connectionId,
                    command,
                    format
                }, {
                    responseType: 'blob',
                    signal: abortController.signal,
                    timeout: 300000,
                    onDownloadProgress: (progressEvent) => {
                        if (progressEvent.total && onProgress) {
                            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            onProgress(progress);
                        }
                    }
                });

                clearTimeout(timeoutId);

                const blob = response.data;

                if (!blob || blob.size === 0) {
                    throw new Error('No data received from server');
                }

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `logs-${connectionId}-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${format}`;
                document.body.appendChild(a);
                a.click();

                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                if (onProgress) {
                    onProgress(100);
                }

            } catch (error: any) {
                attempt++;

                if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return attemptDownload();
                    } else {
                        throw new Error('Download timed out after multiple attempts. The log file might be too large.');
                    }
                } else if (error.response?.status === 500 && attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return attemptDownload();
                } else {
                    console.error('Download error:', error);
                    const errorMessage = error.response?.data?.error ||
                        error.message ||
                        'Failed to download logs';
                    throw new Error(errorMessage);
                }
            }
        };

        return attemptDownload();
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