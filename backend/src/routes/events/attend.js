// C:\OSPanel\domains\karny\backend\src\routes\events\attend.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * POST /api/rooms/:roomId/events/:eventId/attend
 * Отметить участие в событии
 */
router.post('/:eventId/attend', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const { status = 'going' } = req.body;
    const userId = req.body.userId || 1;
    
    const connection = await pool.getConnection();
    
    try {
      const [members] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: 'Вы не участник этой комнаты' });
      }
      
      const [events] = await connection.execute(
        'SELECT * FROM events WHERE id = ? AND room_id = ?',
        [eventId, roomId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      await connection.execute(
        `INSERT INTO event_attendees (event_id, user_id, status) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
        [eventId, userId, status]
      );
      
      res.json({ success: true, message: 'Статус обновлён' });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка отметки участия:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;