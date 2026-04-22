// C:\OSPanel\domains\karny\backend\src\routes\events\attendees.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * GET /api/rooms/:roomId/events/:eventId/attendees
 * Получить список участников события
 */
router.get('/:eventId/attendees', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [members] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: 'Вы не участник этой комнаты' });
      }
      
      const [attendees] = await connection.execute(
        `SELECT u.id, u.username, u.first_name, u.last_name, u.photo_url, ea.status, ea.updated_at
         FROM event_attendees ea
         JOIN users u ON ea.user_id = u.id
         WHERE ea.event_id = ?
         ORDER BY 
           CASE ea.status 
             WHEN 'going' THEN 1 
             WHEN 'maybe' THEN 2 
             WHEN 'declined' THEN 3 
           END,
           u.first_name`,
        [eventId]
      );
      
      const going = attendees.filter(a => a.status === 'going');
      const maybe = attendees.filter(a => a.status === 'maybe');
      const declined = attendees.filter(a => a.status === 'declined');
      
      res.json({ going, maybe, declined, total: attendees.length });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения участников:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;