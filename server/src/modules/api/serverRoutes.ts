import { Router } from 'express';
import isAuthenticated, { AuthenticatedRequest, requireAuth } from '../../middlewares/auth';
import { userService } from '../database/userService';
import { LogCommand, ServerConnection as SSHConnection, sshService } from '../ssh/sshService';

const router = Router();

router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        activeConnections: sshService.getActiveConnections().length
    });
});

router.use(isAuthenticated);


router.get('/connections', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const connections = await userService.getUserConnections(clerkId);

        res.json({
            success: true,
            connections
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connections'
        });
    }
});

router.get('/connections/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const { id } = req.params;

        const connection = await userService.getConnection(clerkId, id);

        if (!connection) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }

        res.json({
            success: true,
            connection
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connection'
        });
    }
});

router.post('/connections', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const connectionData = req.body;

        if (!connectionData.name || !connectionData.host || !connectionData.username || !connectionData.port) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, host, username, port'
            });
        }

        const connection = await userService.createConnection(clerkId, connectionData);

        res.status(201).json({
            success: true,
            connection
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create connection'
        });
    }
});

router.put('/connections/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const { id } = req.params;
        const updateData = req.body;

        const connection = await userService.updateConnection(clerkId, id, updateData);

        if (!connection) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }

        res.json({
            success: true,
            connection
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update connection'
        });
    }
});

router.delete('/connections/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const { id } = req.params;

        const success = await userService.deleteConnection(clerkId, id);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }

        res.json({
            success: true,
            message: 'Connection deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete connection'
        });
    }
});


router.post('/connect-direct', async (req: AuthenticatedRequest, res) => {
    try {
        const connection: SSHConnection = req.body;

        console.log('🔗 Direct connection request:', {
            host: connection.host,
            username: connection.username,
            port: connection.port,
            isGuest: req.isGuest
        });

        if (!connection.host || !connection.username || !connection.port) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: host, username, port'
            });
        }

        if (!connection.id) {
            connection.id = req.isGuest
                ? `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        if (sshService.isConnected(connection.id)) {
            return res.json({
                success: true,
                message: 'Already connected',
                connectionId: connection.id
            });
        }

        await sshService.connectToServer(connection);

        res.json({
            success: true,
            message: 'Connected successfully',
            connectionId: connection.id
        });
    } catch (error) {
        console.error('Direct connection error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed'
        });
    }
});

router.post('/test-connection', async (req: AuthenticatedRequest, res) => {
    try {
        const connection: SSHConnection = req.body;

        console.log('🔍 Testing connection:', {
            host: connection.host,
            username: connection.username,
            port: connection.port,
            isGuest: req.isGuest
        });

        if (!connection.host || !connection.username || !connection.port) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: host, username, port'
            });
        }

        const isConnected = await sshService.testConnection(connection);

        res.json({
            success: isConnected,
            message: isConnected ? 'Connection successful' : 'Connection failed'
        });
    } catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/connect/:connectionId', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const { connectionId } = req.params;

        const savedConnection = await userService.getConnection(clerkId, connectionId);
        if (!savedConnection) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }

        let password: string | undefined;
        if (savedConnection.encryptedPassword) {
            try {
                if (savedConnection.encryptedPassword.includes(':')) {
                    const [encryptedData, salt] = savedConnection.encryptedPassword.split(':');
                    if (salt === 'demo-salt') {
                        password = Buffer.from(encryptedData, 'base64').toString();
                        console.log('⚠️ Using legacy demo decryption - consider migrating to proper AES');
                    } else {
                        const masterKey = 'default-master-key'; // TODO: Get from user session

                        const { decryptData } = await import('../../utils/encryption');
                        password = decryptData({
                            encryptedData,
                            salt,
                            masterKey
                        });
                        console.log('✅ Using proper AES decryption');
                    }
                } else {
                    console.warn('Invalid encrypted password format - missing salt');
                }
            } catch (error) {
                console.error('Password decryption failed:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to decrypt connection credentials. Please re-enter your credentials.'
                });
            }
        }

        let privateKey: string | undefined;
        if (savedConnection.encryptedPrivateKey) {
            try {
                if (savedConnection.encryptedPrivateKey.includes(':')) {
                    const [encryptedData, salt] = savedConnection.encryptedPrivateKey.split(':');
                    if (salt === 'demo-salt') {
                        privateKey = Buffer.from(encryptedData, 'base64').toString();
                    } else {
                        const masterKey = 'default-master-key'; // TODO: Get from user session
                        const { decryptData } = await import('../../utils/encryption');
                        privateKey = decryptData({
                            encryptedData,
                            salt,
                            masterKey
                        });
                    }
                }
            } catch (error) {
                console.error('Private key decryption failed:', error);
            }
        }

        let passphrase: string | undefined;
        if (savedConnection.encryptedPassphrase) {
            try {
                if (savedConnection.encryptedPassphrase.includes(':')) {
                    const [encryptedData, salt] = savedConnection.encryptedPassphrase.split(':');
                    if (salt === 'demo-salt') {
                        passphrase = Buffer.from(encryptedData, 'base64').toString();
                    } else {
                        const masterKey = 'default-master-key'; // TODO: Get from user session
                        const { decryptData } = await import('../../utils/encryption');
                        passphrase = decryptData({
                            encryptedData,
                            salt,
                            masterKey
                        });
                    }
                }
            } catch (error) {
                console.error('Passphrase decryption failed:', error);
            }
        }

        const sshConnection: SSHConnection = {
            id: savedConnection.id,
            name: savedConnection.name,
            host: savedConnection.host,
            port: savedConnection.port,
            username: savedConnection.username,
            password: password,
            privateKey: privateKey,
            passphrase: passphrase,
        };

        if (sshService.isConnected(connectionId)) {
            return res.json({
                success: true,
                message: 'Already connected',
                connectionId
            });
        }

        await sshService.connectToServer(sshConnection);

        await userService.updateConnectionLastUsed(clerkId, connectionId);

        res.json({
            success: true,
            message: 'Connected successfully',
            connectionId
        });
    } catch (error) {
        console.error('SSH Connection error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed'
        });
    }
});

router.post('/disconnect/:connectionId', (req, res) => {
    try {
        const { connectionId } = req.params;

        if (!sshService.isConnected(connectionId)) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }

        sshService.disconnect(connectionId);

        res.json({
            success: true,
            message: 'Disconnected successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Disconnection failed'
        });
    }
});

router.get('/active-connections', (req, res) => {
    try {
        const connections = sshService.getActiveConnections();
        res.json({
            success: true,
            connections
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get active connections'
        });
    }
});

router.post('/execute-command', async (req, res) => {
    try {
        const { connectionId, command }: { connectionId: string, command: LogCommand } = req.body;

        if (!connectionId || !command) {
            return res.status(400).json({
                success: false,
                error: 'Missing connectionId or command'
            });
        }

        if (!sshService.isConnected(connectionId)) {
            return res.status(404).json({
                success: false,
                error: 'Server not connected'
            });
        }

        if (command.follow) {
            return res.status(400).json({
                success: false,
                error: 'Use WebSocket for streaming commands'
            });
        }

        const result = await sshService.executeLogCommand(connectionId, command);

        res.json({
            success: true,
            data: result,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Command execution failed'
        });
    }
});

router.post('/read-file', async (req, res) => {
    try {
        const { connectionId, filePath }: { connectionId: string, filePath: string } = req.body;

        if (!connectionId || !filePath) {
            return res.status(400).json({
                success: false,
                error: 'Missing connectionId or filePath'
            });
        }

        if (!sshService.isConnected(connectionId)) {
            return res.status(404).json({
                success: false,
                error: 'Server not connected'
            });
        }

        const content = await sshService.readLogFile(connectionId, filePath);

        res.json({
            success: true,
            content,
            filePath,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to read file'
        });
    }
});

router.post('/download-logs', async (req, res) => {
    try {
        const { connectionId, command, format = 'txt' }: {
            connectionId: string,
            command: LogCommand,
            format?: 'txt' | 'json'
        } = req.body;

        if (!connectionId || !command) {
            return res.status(400).json({
                success: false,
                error: 'Missing connectionId or command'
            });
        }

        if (!sshService.isConnected(connectionId)) {
            return res.status(404).json({
                success: false,
                error: 'Server not connected'
            });
        }

        req.setTimeout(300000);
        res.setTimeout(300000);

        console.log(`Starting log download for connection ${connectionId} with command: ${command.value}`);

        const downloadCommand = { ...command, follow: false };

        let result: string | void;
        try {
            result = await sshService.executeLogCommand(connectionId, downloadCommand);
        } catch (sshError) {
            console.error('SSH command execution failed:', sshError);
            return res.status(500).json({
                success: false,
                error: `Command execution failed: ${sshError instanceof Error ? sshError.message : 'Unknown SSH error'}`
            });
        }

        if (typeof result !== 'string') {
            return res.status(500).json({
                success: false,
                error: 'No data received from command execution'
            });
        }

        if (!result || result.trim().length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No log data found for the specified command'
            });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `logs-${connectionId}-${timestamp}`;

        console.log(`Log data retrieved: ${result.length} characters, format: ${format}`);

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        if (format === 'json') {
            const logs = result.split('\n')
                .filter(line => line.trim().length > 0)
                .map((line, index) => ({
                    lineNumber: index + 1,
                    content: line,
                    timestamp: new Date(),
                    level: getLogLevel(line)
                }));

            const jsonData = {
                metadata: {
                    connectionId,
                    command: downloadCommand,
                    exportTimestamp: new Date(),
                    totalLines: logs.length,
                    format: 'json'
                },
                logs
            };

            const jsonString = JSON.stringify(jsonData, null, 2);

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.setHeader('Content-Length', Buffer.byteLength(jsonString, 'utf8'));
            res.send(jsonString);
        } else {
            const header = `# Log Export\n# Connection: ${connectionId}\n# Command: ${downloadCommand.value}\n# Export Time: ${new Date().toISOString()}\n# Total Lines: ${result.split('\n').length}\n\n`;
            const content = header + result;

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
            res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
            res.send(content);
        }

        console.log(`Log download completed successfully: ${filename}.${format}`);

    } catch (error) {
        console.error('Download logs error:', error);

        if (!res.headersSent) {
            const errorMessage = error instanceof Error ? error.message : 'Download failed';
            res.status(500).json({
                success: false,
                error: errorMessage
            });
        }
    }
});

function getLogLevel(content: string): 'error' | 'warn' | 'info' | 'debug' | 'default' {
    if (!content || typeof content !== 'string') return 'default';

    const lower = content.toLowerCase();

    if (lower.includes('error') || lower.includes('err') || lower.includes('failed') ||
        lower.includes('exception') || lower.includes('fatal') || lower.includes('panic') ||
        lower.includes('critical') || lower.match(/\berr\b/) || lower.includes('stderr')) {
        return 'error';
    }

    if (lower.includes('warn') || lower.includes('warning') || lower.includes('caution') ||
        lower.includes('deprecated') || lower.match(/\bwarn\b/)) {
        return 'warn';
    }

    if (lower.includes('info') || lower.includes('information') || lower.includes('notice') ||
        lower.match(/\binfo\b/) || lower.includes('log:')) {
        return 'info';
    }

    if (lower.includes('debug') || lower.includes('trace') || lower.includes('verbose') ||
        lower.match(/\bdebug\b/) || lower.match(/\btrace\b/)) {
        return 'debug';
    }

    return 'default';
}


const serverRoutes = router;
export default serverRoutes;