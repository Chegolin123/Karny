// C:\OSPanel\domains\karny\backend\src\routes\messages.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');

/**
 * GET /api/rooms/:roomId/messages
 * Получить сообщения комнаты
 */
router.get('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 30;
    const before = req.query.before ? parseInt(req.query.before) : null;
    
    console.log('📨 GET /messages', { roomId, userId, limit, before });
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Проверяем, что пользователь участник комнаты
      const [members] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: 'Вы не участник этой комнаты' });
      }
      
      // Получаем сообщения (интерполяция limit, т.к. mysql2 не поддерживает ? для LIMIT)
      let messagesQuery;
      let params;
      
      if (before) {
        messagesQuery = `
          SELECT * FROM messages 
          WHERE room_id = ? AND id < ? 
          ORDER BY created_at DESC 
          LIMIT ${limit}
        `;
        params = [roomId, before];
      } else {
        messagesQuery = `
          SELECT * FROM messages 
          WHERE room_id = ? 
          ORDER BY created_at DESC 
          LIMIT ${limit}
        `;
        params = [roomId];
      }
      
      console.log('📝 SQL Query:', messagesQuery);
      console.log('📝 Params:', params);
      
      const [messages] = await connection.execute(messagesQuery, params);
      
      console.log(`📨 Найдено сообщений: ${messages.length}`);
      
      // Если сообщений нет, возвращаем пустой массив
      if (messages.length === 0) {
        return res.json({ 
          messages: [],
          hasMore: false
        });
      }
      
      // Получаем информацию о пользователях для каждого сообщения
      const userIds = [...new Set(messages.map(m => m.user_id))];
      
      if (userIds.length > 0) {
        // Создаём плейсхолдеры для IN запроса
        const placeholders = userIds.map(() => '?').join(',');
        const [users] = await connection.execute(
          `SELECT id, first_name, last_name, username, photo_url FROM users WHERE id IN (${placeholders})`,
          userIds
        );
        
        // Создаём карту пользователей для быстрого доступа
        const usersMap = {};
        users.forEach(u => { usersMap[u.id] = u; });
        
        // Добавляем данные пользователя к каждому сообщению
        const messagesWithUsers = messages.map(msg => ({
          id: msg.id,
          room_id: msg.room_id,
          user_id: msg.user_id,
          content: msg.content,
          created_at: msg.created_at,
          user: usersMap[msg.user_id] || null
        }));
        
        res.json({ 
          messages: messagesWithUsers.reverse(),
          hasMore: messages.length === limit
        });
      } else {
        res.json({ 
          messages: messages.reverse(),
          hasMore: messages.length === limit
        });
      }
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка получения сообщений:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;