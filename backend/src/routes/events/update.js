// C:\OSPanel\domains\karny\backend\src\routes\events\update.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * PUT /api/rooms/:roomId/events/:eventId
 * Обновить событие (только админ или создатель)
 */
router.put('/:eventId', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const { name, description, eventDate, timeVotingEnabled, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название события должно быть не менее 3 символов' });
    }
    
    if (!timeVotingEnabled && !eventDate) {
      return res.status(400).json({ error: 'Укажите дату или включите обсуждение времени' });
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
        'SELECT created_by FROM events WHERE id = ? AND room_id = ?',
        [eventId, roomId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      const isOwner = rooms[0].owner_id == userId;
      const isCreator = events[0].created_by == userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ error: 'Только админ или создатель может редактировать событие' });
      }
      
      await connection.execute(
        `UPDATE events 
         SET name = ?, description = ?, event_date = ?, time_voting_enabled = ?, updated_at = NOW() 
         WHERE id = ?`,
        [name.trim(), description || null, eventDate || null, timeVotingEnabled ? 1 : 0, eventId]
      );
      
      const [updatedEvents] = await connection.execute(
        `SELECT e.*, u.first_name as creator_name,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going') as going_count
         FROM events e
         JOIN users u ON e.created_by = u.id
         WHERE e.id = ?`,
        [eventId]
      );
      
      res.json({
        success: true,
        event: updatedEvents[0],
        message: 'Событие обновлено'
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка обновления события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;