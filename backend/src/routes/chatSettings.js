// C:\OSPanel\domains\karny\backend\src\routes\chatSettings.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');

/**
 * GET /api/rooms/:roomId/chat/notifications
 * Получить настройки уведомлений чата для пользователя
 */
router.get('/notifications', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT chat_notifications_enabled FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден в комнате' });
      }
      
      res.json({ 
        enabled: rows[0].chat_notifications_enabled !== false 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения настроек уведомлений:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/rooms/:roomId/chat/notifications
 * Включить/выключить уведомления чата
 */
router.post('/notifications', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { userId, enabled } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE room_members SET chat_notifications_enabled = ? WHERE room_id = ? AND user_id = ?',
        [enabled ? 1 : 0, roomId, userId]
      );
      
      res.json({ 
        success: true, 
        enabled 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка обновления настроек уведомлений:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;