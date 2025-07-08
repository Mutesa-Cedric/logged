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

            const command = logCommand.type === 'command'
                ? logCommand.value
                : `tail ${logCommand.follow ? '-f' : ''} ${logCommand.value}`;

            client.exec(command, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                stream.on('close', (code: number, signal: string) => {
                    if (code !== 0) {
                        this.emit('commandError', { connectionId, code, signal });
                    }
                    if (!logCommand.follow) {
                        resolve(output);
                    }
                });

                stream.on('data', (data: Buffer) => {
                    const content = data.toString();
                    output += content;

                    if (onData) {
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
                    this.emit('logError', {
                        connectionId,
                        error,
                        timestamp: new Date()
                    });
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