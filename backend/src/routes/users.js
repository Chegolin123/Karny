// C:\OSPanel\domains\karny\backend\src\routes\users.js

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * POST /api/users/chat-id
 * Сохранить chat_id пользователя
 */
router.post('/chat-id', async (req, res) => {
  try {
    const { userId, chatId } = req.body;
    
    if (!userId || !chatId) {
      return res.status(400).json({ error: 'userId и chatId обязательны' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE users SET chat_id = ? WHERE id = ?',
        [chatId, userId]
      );
      
      console.log(`✅ chat_id сохранён для пользователя ${userId}`);
      
      res.json({ success: true });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка сохранения chat_id:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/users/notifications
 * Включить/выключить уведомления
 */
router.post('/notifications', async (req, res) => {
  try {
    const { userId, enabled } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE users SET notifications_enabled = ? WHERE id = ?',
        [enabled, userId]
      );
      
      res.json({ success: true, enabled });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * GET /api/users/events/new
 * Получить новые события для пользователя
 */
router.get('/events/new', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [events] = await connection.execute(
        `SELECT e.*, r.name as room_name, r.id as room_id
         FROM events e
         JOIN rooms r ON e.room_id = r.id
         JOIN room_members rm ON r.id = rm.room_id
         LEFT JOIN event_notifications en ON e.id = en.event_id AND en.user_id = ?
         WHERE rm.user_id = ?
           AND e.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
           AND en.event_id IS NULL
         ORDER BY e.created_at DESC`,
        [userId, userId]
      );
      
      for (const event of events) {
        await connection.execute(
          'INSERT IGNORE INTO event_notifications (event_id, user_id) VALUES (?, ?)',
          [event.id, userId]
        );
      }
      
      res.json({ events });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения новых событий:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * GET /api/users/events
 * Получить все события пользователя из всех комнат
 */
router.get('/events', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [events] = await connection.execute(
        `SELECT e.*, r.name as room_name, r.id as room_id
         FROM events e
         JOIN rooms r ON e.room_id = r.id
         JOIN room_members rm ON r.id = rm.room_id
         WHERE rm.user_id = ?
         ORDER BY e.event_date ASC`,
        [userId]
      );
      
      res.json({ events });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения событий пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;