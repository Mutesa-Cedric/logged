import { Client, ConnectConfig } from 'ssh2';
import { EventEmitter } from 'events';

export interface ServerConnection {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}

export interface LogCommand {
    type: 'command' | 'file';
    value: string; // e.g., "docker logs -f myapp -n 1000" or "/var/log/app.log"
    follow?: boolean; // for real-time streaming
}

export interface LogEntry {
    timestamp: Date;
    content: string;
    source: string;
}

export class SSHService extends EventEmitter {
    private connections: Map<string, Client> = new Map();

    async connectToServer(connection: ServerConnection): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const client = new Client();

            const config: ConnectConfig = {
                host: connection.host,
                port: connection.port,
                username: connection.username,
            };

            if (connection.password) {
                config.password = connection.password;
            } else if (connection.privateKey) {
                config.privateKey = connection.privateKey;
                if (connection.passphrase) {
                    config.passphrase = connection.passphrase;
                }
            }

            client.on('ready', () => {
                this.connections.set(connection.id, client);
                this.emit('connected', connection.id);
                resolve(true);
            });

            client.on('error', (err) => {
                this.emit('error', { connectionId: connection.id, error: err.message });
                reject(err);
            });

            client.on('close', () => {
                this.connections.delete(connection.id);
                this.emit('disconnected', connection.id);
            });

            try {
                client.connect(config);
            } catch (error) {
                reject(error);
            }
        });
    }

    async executeLogCommand(
        connectionId: string,
        logCommand: LogCommand,
        onData?: (data: string) => void
    ): Promise<string | void> {
        const client = this.connections.get(connectionId);
        if (!client) {
            throw new Error(`No active connection found for ${connectionId}`);
        }

        return new Promise((resolve, reject) => {
            let output = '';
            let isStreaming = logCommand.follow || false;
            let dataReceived = false;

            const command = logCommand.type === 'command'
                ? logCommand.value
                : `tail ${logCommand.follow ? '-f' : ''} ${logCommand.value}`;

            console.log(`Executing command: ${command} (streaming: ${isStreaming})`);

            client.exec(command, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                let streamEnded = false;

                stream.on('close', (code: number, signal: string) => {
                    streamEnded = true;
                    console.log(`Command closed with code: ${code}, signal: ${signal}`);

                    if (code !== 0 && code !== null) {
                        const errorMessage = code === 1 ? 
                            'Command failed (exit code 1) - this may be normal for some commands' :
                            `Command exited with code ${code}`;
                        
                        this.emit('logData', {
                            connectionId,
                            data: `COMMAND INFO: ${errorMessage}\n`,
                            timestamp: new Date()
                        });

                        this.emit('commandError', { connectionId, code, signal });
                    }

                    if (!isStreaming) {
                        console.log(`Non-streaming command completed. Data received: ${dataReceived}, Output length: ${output.length}, Output: "${output.trim()}"`);
                        
                        if (!dataReceived && output.trim().length === 0) {
                            let errorMsg = 'No data received from command.';
                            if (code === 1) {
                                errorMsg += ' The command may have failed or the resource may not exist.';
                            } else if (code === 127) {
                                errorMsg += ' Command not found.';
                            } else if (code === 126) {
                                errorMsg += ' Permission denied or command not executable.';
                            } else if (code !== 0 && code !== null) {
                                errorMsg += ` Command exited with code ${code}.`;
                            }
                            console.log(`Rejecting with error: ${errorMsg}`);
                            reject(new Error(errorMsg));
                        } else {
                            console.log(`Resolving with output: "${output.trim()}"`);
                            resolve(output);
                        }
                    } else {
                        resolve();
                    }
                });

                stream.on('data', (data: Buffer) => {
                    const content = data.toString();
                    output += content;
                    dataReceived = true;

                    console.log(`SSH data received (${content.length} chars): "${content.trim()}"`);

                    if (onData && !streamEnded) {
                        console.log(`Calling onData callback with: "${content.trim()}"`);
                        onData(content);
                    }

                    this.emit('logData', {
                        connectionId,
                        data: content,
                        timestamp: new Date()
                    });
                });

                stream.stderr.on('data', (data: Buffer) => {
                    const error = data.toString();
                    console.log(`Command stderr: ${error}`);

                    this.emit('logData', {
                        connectionId,
                        data: `STDERR: ${error}`,
                        timestamp: new Date()
                    });

                    if (onData && !streamEnded) {
                        onData(`STDERR: ${error}`);
                    }

                    if (!isStreaming) {
                        output += `STDERR: ${error}`;
                        dataReceived = true;
                    }

                    const lowerError = error.toLowerCase();
                    const isCriticalError = lowerError.includes('permission denied') || 
                                          lowerError.includes('connection refused') ||
                                          lowerError.includes('no such file') ||
                                          lowerError.includes('command not found') ||
                                          lowerError.includes('authentication failed') ||
                                          lowerError.includes('no such container') ||
                                          lowerError.includes('error response from daemon');
                    
                    if (isCriticalError) {
                        let contextualError = error;
                        if (lowerError.includes('no such container')) {
                            contextualError += ' (Container may not exist or may be stopped)';
                        } else if (lowerError.includes('error response from daemon')) {
                            contextualError += ' (Docker daemon error - check container name and status)';
                        }
                        
                        this.emit('logError', {
                            connectionId,
                            error: contextualError,
                            timestamp: new Date()
                        });
                    }
                });

                const timeoutDuration = isStreaming ? 30000 : 300000; // 30s for streaming, 5min for downloads
                const timeoutId = setTimeout(() => {
                    if (!streamEnded) {
                        console.log(`Command timeout (${timeoutDuration / 1000}s), ending stream`);
                        stream.end();
                        if (!isStreaming && !dataReceived) {
                            reject(new Error(`Command timed out after ${timeoutDuration / 1000} seconds with no data received`));
                        }
                    }
                }, timeoutDuration);

                stream.on('close', () => {
                    clearTimeout(timeoutId);
                });
            });
        });
    }

    async readLogFile(connectionId: string, filePath: string): Promise<string> {
        const client = this.connections.get(connectionId);
        if (!client) {
            throw new Error(`No active connection found for ${connectionId}`);
        }

        return new Promise((resolve, reject) => {
            client.sftp((err, sftp) => {
                if (err) {
                    reject(err);
                    return;
                }

                sftp.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data.toString());
                });
            });
        });
    }

    async testConnection(connection: ServerConnection): Promise<boolean> {
        try {
            await this.connectToServer(connection);
            this.disconnect(connection.id);
            return true;
        } catch (error) {
            return false;
        }
    }

    disconnect(connectionId: string): void {
        const client = this.connections.get(connectionId);
        if (client) {
            client.end();
            this.connections.delete(connectionId);
        }
    }

    disconnectAll(): void {
        for (const [id, client] of this.connections) {
            client.end();
        }
        this.connections.clear();
    }

    getActiveConnections(): string[] {
        return Array.from(this.connections.keys());
    }

    isConnected(connectionId: string): boolean {
        return this.connections.has(connectionId);
    }
}

export const sshService = new SSHService(); 