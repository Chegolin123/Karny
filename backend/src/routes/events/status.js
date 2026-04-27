// C:\OSPanel\domains\karny\backend\src\routes\events\status.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * GET /api/rooms/:roomId/events/:eventId/status
 * Получить статус участия пользователя в событии
 */
router.get('/:eventId/status', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [events] = await connection.execute(
        'SELECT id FROM events WHERE id = ? AND room_id = ?',
        [eventId, roomId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      const [attendees] = await connection.execute(
        'SELECT status FROM event_attendees WHERE event_id = ? AND user_id = ?',
        [eventId, userId]
      );
      
      res.json({ status: attendees.length > 0 ? attendees[0].status : null });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения статуса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;