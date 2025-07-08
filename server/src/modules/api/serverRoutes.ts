import { Router } from 'express';
import { sshService, ServerConnection as SSHConnection, LogCommand } from '../ssh/sshService';
import { userService } from '../database/userService';
import isAuthenticated, { AuthenticatedRequest } from '../../middlewares/auth';

const router = Router();

// Health check - No authentication required
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        activeConnections: sshService.getActiveConnections().length
    });
});

// Apply authentication middleware to all other routes
router.use(isAuthenticated);

// CRUD Operations for saved connections

// Get all saved connections for user
router.get('/connections', async (req: AuthenticatedRequest, res) => {
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

// Get a specific connection
router.get('/connections/:id', async (req: AuthenticatedRequest, res) => {
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

// Create a new connection
router.post('/connections', async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const connectionData = req.body;

        // Validate required fields
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

// Update a connection
router.put('/connections/:id', async (req: AuthenticatedRequest, res) => {
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

// Delete a connection
router.delete('/connections/:id', async (req: AuthenticatedRequest, res) => {
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

// SSH Operations (updated to work with saved connections)

// Test connection (works with both saved and unsaved)
router.post('/test-connection', async (req: AuthenticatedRequest, res) => {
    try {
        const connection: SSHConnection = req.body;

        // Validate required fields
        if (!connection.host || !connection.username || !connection.port) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: host, username, port'
            });
        }

        // Test the connection
        const isConnected = await sshService.testConnection(connection);

        res.json({
            success: isConnected,
            message: isConnected ? 'Connection successful' : 'Connection failed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Connect to server using saved connection
router.post('/connect/:connectionId', async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const { connectionId } = req.params;

        // Get the saved connection
        const savedConnection = await userService.getConnection(clerkId, connectionId);
        if (!savedConnection) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found'
            });
        }

        // Decrypt password if available
        let password: string | undefined;
        if (savedConnection.encryptedPassword) {
            try {
                // For demo purposes, decrypt the simple base64 format: "encryptedData:salt"
                const [encryptedData, salt] = savedConnection.encryptedPassword.split(':');
                if (salt === 'demo-salt') {
                    // Simple base64 decoding for demo
                    password = Buffer.from(encryptedData, 'base64').toString();
                } else {
                    // TODO: Implement proper AES decryption for production
                    console.warn('AES decryption not implemented yet');
                }
            } catch (error) {
                console.error('Password decryption failed:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to decrypt connection credentials'
                });
            }
        }

        // Convert to SSH connection format
        const sshConnection: SSHConnection = {
            id: savedConnection.id,
            name: savedConnection.name,
            host: savedConnection.host,
            port: savedConnection.port,
            username: savedConnection.username,
            password: password, // Now properly decrypted
        };

        // Check if already connected
        if (sshService.isConnected(connectionId)) {
            return res.json({
                success: true,
                message: 'Already connected',
                connectionId
            });
        }

        await sshService.connectToServer(sshConnection);

        // Update last used timestamp
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

// Disconnect from server
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

// Get active SSH connections
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

// Execute log command (one-time)
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

        // For non-streaming commands only
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

// Read log file
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

// Download logs (export)
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

        // Ensure it's not a streaming command for download
        const downloadCommand = { ...command, follow: false };
        const result = await sshService.executeLogCommand(connectionId, downloadCommand);

        if (typeof result !== 'string') {
            return res.status(500).json({
                success: false,
                error: 'No data received'
            });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `logs-${connectionId}-${timestamp}`;

        if (format === 'json') {
            const jsonData = {
                connectionId,
                command: downloadCommand,
                timestamp: new Date(),
                logs: result.split('\n').map((line, index) => ({
                    lineNumber: index + 1,
                    content: line,
                    timestamp: new Date()
                }))
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.send(JSON.stringify(jsonData, null, 2));
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
            res.send(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Download failed'
        });
    }
});

const serverRoutes = router;
export default serverRoutes;