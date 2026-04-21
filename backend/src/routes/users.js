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

module.exports = router;