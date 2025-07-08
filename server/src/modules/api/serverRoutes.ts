import { Router } from 'express';
import { sshService, ServerConnection, LogCommand } from '../ssh/sshService';

const router = Router();

// Test server connection
router.post('/test-connection', async (req, res) => {
    try {
        const connection: ServerConnection = req.body;

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

// Connect to server
router.post('/connect', async (req, res) => {
    try {
        const connection: ServerConnection = req.body;

        // Validate required fields
        if (!connection.id || !connection.host || !connection.username || !connection.port) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: id, host, username, port'
            });
        }

        // Check if already connected
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

// Get active connections
router.get('/connections', (req, res) => {
    try {
        const connections = sshService.getActiveConnections();
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

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        activeConnections: sshService.getActiveConnections().length
    });
});

const serverRoutes = router;
export default serverRoutes;