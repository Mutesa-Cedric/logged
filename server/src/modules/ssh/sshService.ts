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
                readyTimeout: 20000, // 20 second timeout for connection
                keepaliveInterval: 0, // Disable keepalive for test connections
                algorithms: {
                    kex: [
                        'diffie-hellman-group-exchange-sha256',
                        'diffie-hellman-group14-sha256',
                        'diffie-hellman-group16-sha512',
                        'diffie-hellman-group18-sha512',
                        'ecdh-sha2-nistp256',
                        'ecdh-sha2-nistp384',
                        'ecdh-sha2-nistp521'
                    ],
                    cipher: [
                        'aes128-ctr',
                        'aes192-ctr', 
                        'aes256-ctr',
                        'aes128-gcm',
                        'aes256-gcm'
                    ],
                    serverHostKey: [
                        'ssh-rsa',
                        'ecdsa-sha2-nistp256',
                        'ecdsa-sha2-nistp384',
                        'ecdsa-sha2-nistp521',
                        'ssh-ed25519'
                    ],
                    hmac: [
                        'hmac-sha2-256',
                        'hmac-sha2-512',
                        'hmac-sha1'
                    ]
                }
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

    async testConnection(connection: ServerConnection): Promise<{
        success: boolean;
        error?: string;
        details?: any;
    }> {
        const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const testConnection = { ...connection, id: testId };

        console.log('🔍 Starting connection test:', {
            host: connection.host,
            username: connection.username,
            port: connection.port,
            authType: connection.password ? 'password' : connection.privateKey ? 'privateKey' : 'none',
            testId
        });

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Connection test timed out after 15 seconds'));
                }, 15000);
            });

            const connectPromise = this.connectToServer(testConnection);
            
            await Promise.race([connectPromise, timeoutPromise]);
            
            console.log('✅ Connection test successful for:', connection.host);
            this.disconnect(testId);
            
            return { success: true };
        } catch (error: any) {
            console.error('❌ Connection test failed for:', connection.host, 'Error:', error.message);
            
            // Clean up any potential connection
            this.disconnect(testId);
            
            // Parse and categorize the error
            let errorMessage = error.message || 'Unknown connection error';
            let errorCategory = 'unknown';

            if (error.code) {
                switch (error.code) {
                    case 'ENOTFOUND':
                        errorCategory = 'dns';
                        errorMessage = `Host not found: ${connection.host}. Please check the hostname or IP address.`;
                        break;
                    case 'ECONNREFUSED':
                        errorCategory = 'connection';
                        errorMessage = `Connection refused to ${connection.host}:${connection.port}. The SSH service may not be running or the port may be blocked.`;
                        break;
                    case 'ETIMEDOUT':
                        errorCategory = 'timeout';
                        errorMessage = `Connection timed out to ${connection.host}:${connection.port}. The host may be unreachable or behind a firewall.`;
                        break;
                    case 'EHOSTUNREACH':
                        errorCategory = 'network';
                        errorMessage = `Host unreachable: ${connection.host}. Please check your network connection and routing.`;
                        break;
                    default:
                        errorCategory = 'network';
                        errorMessage = `Network error (${error.code}): ${errorMessage}`;
                }
            } else if (errorMessage.includes('All configured authentication methods failed')) {
                errorCategory = 'auth';
                errorMessage = 'Authentication failed. Please check your username, password, or SSH key.';
            } else if (errorMessage.includes('Cannot parse privatekey')) {
                errorCategory = 'key';
                errorMessage = 'Invalid SSH private key format. Please check your private key.';
            } else if (errorMessage.includes('Encrypted private key detected')) {
                errorCategory = 'key';
                errorMessage = 'Encrypted private key requires a passphrase. Please provide the correct passphrase.';
            } else if (errorMessage.includes('Host key verification failed')) {
                errorCategory = 'hostkey';
                errorMessage = 'Host key verification failed. The server\'s host key has changed or is not trusted.';
            } else if (errorMessage.includes('Connection test timed out')) {
                errorCategory = 'timeout';
                errorMessage = 'Connection test timed out after 15 seconds. The host may be slow to respond or unreachable.';
            }

            return {
                success: false,
                error: errorMessage,
                details: {
                    category: errorCategory,
                    originalError: error.message,
                    code: error.code,
                    host: connection.host,
                    port: connection.port
                }
            };
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