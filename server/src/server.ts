require('dotenv').config();
import express = require('express');
import cors = require('cors');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import { createServer } from 'http';
import serverRoutes from './modules/api/serverRoutes';
import { SocketService } from './modules/websocket/socketService';
import { connectDatabase } from './utils/database';

// import { dbConnection } from './utils/dbConnection';
const PORT = process.env.PORT || 8000;

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO service
const socketService = new SocketService(httpServer);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// dbConnection()
//   .then(() => {
//     console.log('Database connected');
//     httpServer.listen(PORT, () => {
//       console.log(`Server is listening on port ${PORT}`);
//       console.log(`WebSocket server ready for connections`);
//     });
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// Initialize database and start server
connectDatabase()
  .then((success) => {
    if (success) {
      console.log('✅ Database connected successfully');
    } else {
      console.warn('⚠️ Database connection failed, running without persistence');
    }

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}`);
      console.log(`🔌 WebSocket server ready for connections`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize server:', err);
    // Start server anyway but without database
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT} (without database)`);
      console.log(`🔌 WebSocket server ready for connections`);
    });
  });

app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  origin && res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,DELETE',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization',
  );
  next();
});

// log every request
app.use((req, res, next) => {
  console.log(req.originalUrl, '\t', req.method, '\t', req.url);
  next();
});

// router middlewares
app.use('/api/servers', serverRoutes);

app.get('/', (req, res) => {
  res.send('Logged - Log Viewer Server');
});
