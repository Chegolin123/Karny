// C:\OSPanel\domains\karny\backend\src\routes\events\remind.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');
const { sendEventReminder } = require('../../services/notificationService');

/**
 * POST /api/rooms/:roomId/events/:eventId/remind
 * Отправить напоминание о событии (только админ/создатель)
 */
router.post('/:eventId/remind', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        'SELECT owner_id FROM rooms WHERE id = ?',
        [roomId]
      );
      
      if (rooms.length === 0) {
        return res.status(404).json({ error: 'Комната не найдена' });
      }
      
      const [events] = await connection.execute(
        `SELECT e.*, u.first_name as creator_name,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going') as going_count
         FROM events e
         JOIN users u ON e.created_by = u.id
         WHERE e.id = ? AND e.room_id = ?`,
        [eventId, roomId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      const event = events[0];
      const isOwner = rooms[0].owner_id == userId;
      const isCreator = event.created_by == userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ error: 'Только админ или создатель может отправить напоминание' });
      }
      
      const result = await sendEventReminder(roomId, event, userId);
      
      res.json({
        success: true,
        message: 'Напоминания отправлены',
        sentCount: result.sentCount,
        totalMembers: result.totalMembers
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка отправки напоминания:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;