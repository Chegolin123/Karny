// C:\OSPanel\domains\karny\backend\src\index.js

const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { testConnection } = require('./db');
const setupWebSocket = require('./websocket');

const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const eventsRoutes = require('./routes/events');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3001;

// Создаём HTTP сервер
const server = http.createServer(app);

// Настраиваем WebSocket
setupWebSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Karny API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      rooms: '/api/rooms',
      users: '/api/users',
      messages: '/api/rooms/:roomId/messages'
    }
  });
});

app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({ 
    status: 'OK', 
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/rooms/:roomId/events', eventsRoutes);
app.use('/api/rooms/:roomId/messages', messagesRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Запускаем HTTP сервер
server.listen(PORT, async () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  await testConnection();
});