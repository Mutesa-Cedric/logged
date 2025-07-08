# Logged - Web-Based Log Viewer

A modern, web-based log viewer that allows you to connect to remote servers via SSH and view logs in real-time through a beautiful interface. No more struggling with terminal-based log viewing!

## Features

- 🔐 **SSH Connection Management** - Connect to remote servers using password or private key authentication
- 📊 **Real-time Log Streaming** - Stream logs in real-time using WebSocket connections
- 🔍 **Advanced Search** - Search through logs with instant filtering
- 📥 **Download Logs** - Export logs in TXT or JSON format
- 🎯 **Quick Commands** - Pre-defined commands for common log operations
- 🔄 **Auto-scroll** - Automatically scroll to latest logs with manual override
- 🏗️ **Modern UI** - Built with React and Tailwind CSS for a smooth experience

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Socket.IO
- **SSH**: ssh2 library for secure remote connections
- **Real-time**: Socket.IO for WebSocket communication

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Access to remote servers via SSH

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd logged
   ```

2. **Install dependencies**

   ```bash
   # Install server dependencies
   cd server
   pnpm install

   # Install client dependencies
   cd ../client
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   # Server environment
   cd ../server
   cp .env.example .env

   # Client environment
   cd ../client
   cp .env.example .env
   ```

4. **Start the development servers**

   ```bash
   # Terminal 1 - Start the server
   cd server
   pnpm dev

   # Terminal 2 - Start the client
   cd client
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Usage Guide

### 1. Add a Server Connection

Click "Add Server" and fill in your server details:

- **Connection Name**: A friendly name for your server
- **Host**: Server IP address or hostname
- **Port**: SSH port (usually 22)
- **Username**: SSH username
- **Authentication**: Choose between password or private key

### 2. Test Connection

Before saving, click "Test Connection" to verify your credentials work.

### 3. Connect to Server

Once added, click "Connect" on your server to establish an SSH connection.

### 4. View Logs

Select your connected server and:

- **Command Mode**: Run commands like `docker logs -f myapp -n 1000`
- **File Mode**: Read log files directly like `/var/log/nginx/access.log`
- **Stream**: Real-time streaming with `-f` flag
- **Execute**: One-time command execution

### 5. Search and Filter

Use the search box to filter logs in real-time. The counter shows filtered vs total lines.

### 6. Download Logs

Export your logs in TXT or JSON format for further analysis.

## Common Log Commands

The interface provides quick access to common commands:

```bash
# Docker logs
docker logs -f myapp -n 1000
docker logs -f myapp --since 1h

# System logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
journalctl -f -u myservice
tail -f /var/log/syslog
```

## API Endpoints

The server provides a REST API for programmatic access:

- `POST /api/servers/test-connection` - Test server connection
- `POST /api/servers/connect` - Connect to server
- `POST /api/servers/disconnect/:id` - Disconnect from server
- `GET /api/servers/connections` - Get active connections
- `POST /api/servers/execute-command` - Execute one-time command
- `POST /api/servers/read-file` - Read log file
- `POST /api/servers/download-logs` - Download logs
- `GET /api/servers/health` - Health check

## WebSocket Events

Real-time communication uses Socket.IO:

### Client → Server

- `test-connection` - Test server connection
- `connect-server` - Connect to server
- `start-log-stream` - Start log streaming
- `stop-log-stream` - Stop log streaming
- `disconnect-server` - Disconnect from server

### Server → Client

- `connection-test-result` - Connection test result
- `server-connected` - Server connected
- `log-data` - Log data received
- `log-stream-ended` - Stream ended
- `server-error` - Server error occurred

## Security Considerations

- **Credentials**: Server credentials are not stored permanently. They exist only in memory during the session.
- **SSH Keys**: Private keys are transmitted over HTTPS and not logged.
- **Connections**: All connections use secure WebSocket (WSS) in production.
- **CORS**: Configured to only allow connections from your client domain.

## Configuration

### Server Configuration

Edit `server/.env`:

```env
PORT=8000                    # Server port
CLIENT_URL=http://localhost:5173  # Client URL for CORS
NODE_ENV=development         # Environment
```

### Client Configuration

Edit `client/.env`:

```env
VITE_SERVER_URL=http://localhost:8000  # Server URL
```

## Production Deployment

### Using Docker

1. **Build the Docker image**

   ```bash
   cd server
   docker build -t logged-server .
   ```

2. **Run the container**
   ```bash
   docker run -p 8000:8000 -e CLIENT_URL=https://your-domain.com logged-server
   ```

### Manual Deployment

1. **Build the client**

   ```bash
   cd client
   pnpm build
   ```

2. **Build the server**

   ```bash
   cd server
   pnpm build
   ```

3. **Start the server**

   ```bash
   cd server
   pnpm start
   ```

4. **Serve the client** (using nginx, Apache, or any static file server)

## Troubleshooting

### Connection Issues

- **SSH Connection Failed**: Verify host, port, username, and credentials
- **Permission Denied**: Check if the user has appropriate permissions
- **Host Key Verification**: The app accepts unknown host keys automatically

### Log Issues

- **Command Not Found**: Ensure the command exists on the remote server
- **Permission Denied**: Check if the user can access log files
- **No Output**: Some commands may require specific flags or paths

### WebSocket Issues

- **Connection Refused**: Check if the server is running and accessible
- **CORS Errors**: Verify CLIENT_URL in server environment
- **Disconnections**: Check network stability and firewall settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review server logs for error details
