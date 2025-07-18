# Logged - Real-time Server Log Monitoring

A modern web application for monitoring server logs in real-time with SSH connectivity and secure authentication.

## Features

- 🔒 **Secure Authentication** - Clerk-based authentication with guest mode support
- 🌐 **SSH Connections** - Connect to servers via SSH with both password and SSH key authentication
- 📊 **Real-time Log Streaming** - Live log monitoring with WebSocket connectivity
- 💾 **Connection Management** - Save and manage multiple server connections
- 🎨 **Modern UI** - Clean, responsive interface built with Mantine
- 🔐 **Encrypted Storage** - Secure credential storage with AES encryption
- 🌙 **Dark Mode** - Full dark/light theme support

## Authentication Methods

### Password Authentication
Connect to your servers using traditional username/password authentication.

### SSH Key Authentication
For enhanced security, connect using SSH private keys:
- Support for various key formats (RSA, EC, OpenSSH, etc.)
- Optional passphrase support for encrypted keys
- File upload or manual key input
- Automatic key format validation

Supported private key formats:
- `-----BEGIN PRIVATE KEY-----`
- `-----BEGIN RSA PRIVATE KEY-----` 
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- `-----BEGIN EC PRIVATE KEY-----`
- `-----BEGIN DSA PRIVATE KEY-----`
- `-----BEGIN ENCRYPTED PRIVATE KEY-----`

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- Clerk account for authentication

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd logged
```

2. Install dependencies:
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

3. Environment Setup:
```bash
# Server (.env)
DATABASE_URL="mongodb://localhost:27017/logged"
CLERK_SECRET_KEY="your_clerk_secret_key"

# Client (.env.local)
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
```

4. Start the development servers:
```bash
# Start server (from server directory)
npm run dev

# Start client (from client directory) 
npm run dev
```

## Usage

### Adding SSH Key Connections

1. Navigate to the Connections page
2. Click "Add Connection"
3. Fill in the connection details (name, host, port, username)
4. Select "SSH Key" as the authentication type
5. Either upload a private key file or paste the key content manually
6. Add a passphrase if your key is encrypted (optional)
7. Test the connection before saving

### Managing Connections

- **Test Connections**: Verify connectivity before saving
- **Edit Connections**: Update connection details and credentials
- **Secure Storage**: Credentials are encrypted and stored securely
- **Guest Mode**: Try the app without signing up (connections stored locally)

## Architecture

- **Frontend**: React + TypeScript + Mantine UI
- **Backend**: Node.js + Express + Socket.io
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Clerk
- **SSH**: node-ssh for secure connections
- **Encryption**: AES-256 for credential security

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
