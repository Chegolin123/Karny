// /var/www/karny/backend/src/services/cacheService.js

const redis = require('redis');

let client = null;
let isConnected = false;

// Инициализация Redis клиента
async function initRedis() {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    client.on('error', (err) => {
      console.error('❌ Redis error:', err);
      isConnected = false;
    });
    
    client.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });
    
    await client.connect();
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    isConnected = false;
    return false;
  }
}

// Получить статус Redis
function getStatus() {
  return {
    connected: isConnected
  };
}

// Получить данные из кэша
async function getCache(key) {
  if (!isConnected || !client) return null;
  
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Redis get error:', error);
    return null;
  }
}

// Сохранить данные в кэш
async function setCache(key, data, ttl = 300) {
  if (!isConnected || !client) return false;
  
  try {
    await client.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('❌ Redis set error:', error);
    return false;
  }
}

// Удалить данные из кэша
async function deleteCache(key) {
  if (!isConnected || !client) return false;
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('❌ Redis del error:', error);
    return false;
  }
}

// Очистить кэш по паттерну
async function clearCachePattern(pattern) {
  if (!isConnected || !client) return false;
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('❌ Redis clear pattern error:', error);
    return false;
  }
}

// Middleware для кэширования ответов API
function cacheMiddleware(keyPrefix, ttl = 60) {
  return async (req, res, next) => {
    if (!isConnected) {
      return next();
    }
    
    const key = `${keyPrefix}:${req.originalUrl}`;
    
    try {
      const cached = await getCache(key);
      if (cached) {
        console.log(`📦 Cache hit: ${key}`);
        return res.json(cached);
      }
      
      // Перехватываем res.json для сохранения в кэш
      const originalJson = res.json;
      res.json = function(data) {
        setCache(key, data, ttl).catch(console.error);
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      next();
    }
  };
}

// Инвалидация кэша комнаты
async function invalidateRoomCache(roomId) {
  await clearCachePattern(`room:${roomId}:*`);
  await clearCachePattern(`rooms:list:*`);
  await clearCachePattern(`public:rooms:*`);
}

// Инвалидация кэша пользователя
async function invalidateUserCache(userId) {
  await clearCachePattern(`user:${userId}:*`);
}

module.exports = {
  initRedis,
  getStatus,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  cacheMiddleware,
  invalidateRoomCache,
  invalidateUserCache
};