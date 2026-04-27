// C:\OSPanel\domains\karny\backend\src\index.js

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
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
const pollsRoutes = require('./routes/polls');
const fundingsRoutes = require("./routes/fundings");

const app = express();
const PORT = process.env.PORT || 3001;

// Создаём папку для загрузок если её нет
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('📁 Uploads directory:', uploadsDir);

const server = http.createServer(app);

setupWebSocket(server);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🆕 Статическая раздача загруженных файлов — ДОЛЖНА БЫТЬ ДО МАРШРУТОВ
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Разрешаем доступ для изображений
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

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
      messages: '/api/rooms/:roomId/messages',
      upload: '/api/upload',
      polls: '/api/rooms/:roomId/polls'
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

// Настройка multer для загрузки файлов
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения (JPEG, PNG, GIF, WEBP)'));
    }
  }
});

// Эндпоинт загрузки
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🆕 Эндпоинт для получения участников комнаты
app.get('/api/rooms/:roomId/members', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const { pool } = require('./db');
    const connection = await pool.getConnection();
    
    try {
      const [members] = await connection.execute(
        `SELECT u.id, u.first_name, u.last_name, u.username, u.photo_url
         FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = ?
         ORDER BY u.first_name`,
        [roomId]
      );
      
      res.json({ members });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Ошибка получения участников:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/rooms/:roomId/events', eventsRoutes);
app.use('/api/rooms/:roomId/messages', messagesRoutes);
app.use('/api/rooms/:roomId/chat', chatSettingsRoutes);
app.use('/api/rooms/:roomId/polls', pollsRoutes);
app.use("/api/rooms/:roomId/fundings", fundingsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой (макс. 10MB)' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

server.listen(PORT, async () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  await testConnection();
  
  const redisConnected = await initRedis();
  if (redisConnected) {
    console.log('✅ Redis готов к работе');
  } else {
    console.log('⚠️ Приложение работает без кэширования');
  }
});