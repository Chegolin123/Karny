// C:\OSPanel\domains\karny\backend\src\index.js

const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { testConnection } = require('./db');
const setupWebSocket = require('./websocket');
const { initRedis, getStatus } = require('./services/cacheService');

const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms/index');
const eventsRoutes = require('./routes/events/index');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const chatSettingsRoutes = require('./routes/chatSettings');

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

setupWebSocket(server);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  const redisStatus = getStatus();
  res.json({ 
    message: 'Karny API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      rooms: '/api/rooms',
      users: '/api/users',
      messages: '/api/rooms/:roomId/messages'
    },
    redis: redisStatus
  });
});

app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  const redisStatus = getStatus();
  res.json({ 
    status: 'OK', 
    database: dbStatus ? 'connected' : 'disconnected',
    redis: redisStatus.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/rooms/:roomId/events', eventsRoutes);
app.use('/api/rooms/:roomId/messages', messagesRoutes);
app.use('/api/rooms/:roomId/chat', chatSettingsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

server.listen(PORT, async () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  await testConnection();
  
  // Инициализация Redis
  const redisConnected = await initRedis();
  if (redisConnected) {
    console.log('✅ Redis готов к работе');
  } else {
    console.log('⚠️ Приложение работает без кэширования');
  }
});