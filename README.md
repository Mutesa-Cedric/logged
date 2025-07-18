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
- 🤖 **AI Log Analysis** - AI-powered log analysis with streaming responses

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
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd logged
```

2. Install dependencies:
```bash
# Install server dependencies
cd server && pnpm install

# Install client dependencies  
cd ../client && pnpm install
```

3. Environment Setup:
```bash
# Server (.env)
DATABASE_URL="mongodb://localhost:27017/logged"
CLERK_SECRET_KEY="your_clerk_secret_key"
OPENAI_API_KEY="your_openai_api_key"

# Client (.env.local)
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
```

4. Start the development servers:
```bash
# Start server (from server directory)
pnpm run dev

# Start client (from client directory) 
pnpm run dev
```

## Usage

### Adding SSH Key Connections

1. Navigate to the Connections page
2. Click "Add Connection"
3. Fill in the connection details
4. Choose "SSH Key" as the authentication method
5. Upload your private key file or paste the key content
6. If your key is encrypted, enter the passphrase
7. Click "Test Connection" to verify
8. Save the connection

### AI Log Analysis

1. Connect to a server and start streaming logs
2. Click the "Ask AI" button in the logs view
3. Ask questions about your logs such as:
   - "What errors are present in these logs?"
   - "Are there any performance issues?"
   - "What patterns do you notice?"
   - "Summarize the main events"
   - "Are there any security concerns?"
4. The AI will analyze your logs and provide insights with proper formatting

## Features

### Real-time Log Streaming
- Live log monitoring with WebSocket connectivity
- Support for various log commands (tail, grep, etc.)
- Real-time filtering and search
- Log level highlighting

### AI-Powered Analysis
- Stream AI responses in real-time
- Formatted responses with headers, lists, and code blocks
- Context-aware log analysis
- Actionable insights and recommendations

### Connection Management
- Save multiple server connections
- Encrypted credential storage
- Connection history and last used tracking
- Easy connection switching

### Security
- AES-256 encryption for sensitive data
- Secure SSH key handling
- Authentication via Clerk
- Guest mode for temporary connections

## Development

### Tech Stack
- **Frontend**: React, TypeScript, Mantine UI, TanStack Query, Jotai
- **Backend**: Node.js, Express, TypeScript, Prisma
- **AI**: Vercel AI SDK, OpenAI GPT-4o-mini
- **Real-time**: Socket.IO
- **SSH**: SSH2 library
- **Package Manager**: pnpm

### Project Structure
```
logged/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── store/         # State management
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── middlewares/   # Express middlewares
│   │   └── utils/         # Utility functions
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
