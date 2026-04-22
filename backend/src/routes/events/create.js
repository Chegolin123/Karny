// C:\OSPanel\domains\karny\backend\src\routes\events\create.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');
const { notifyRoomMembers } = require('../../services/notificationService');

/**
 * POST /api/rooms/:roomId/events
 * Создать новое событие в комнате
 */
router.post('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { name, description, eventDate, timeVotingEnabled } = req.body;
    const userId = req.body.userId || 1;
    
    console.log('========================================');
    console.log('📝 POST /api/rooms/:roomId/events');
    console.log('roomId:', roomId);
    console.log('name:', name);
    console.log('eventDate:', eventDate);
    console.log('timeVotingEnabled:', timeVotingEnabled);
    console.log('========================================');
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название события должно быть не менее 3 символов' });
    }
    
    if (!timeVotingEnabled && !eventDate) {
      return res.status(400).json({ error: 'Укажите дату или включите обсуждение времени' });
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
      
      const [result] = await connection.execute(
        `INSERT INTO events (room_id, name, description, event_date, time_voting_enabled, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [roomId, name.trim(), description || null, eventDate || null, timeVotingEnabled ? 1 : 0, userId]
      );
      
      const eventId = result.insertId;
      console.log('✅ Событие создано, ID:', eventId);
      
      await connection.execute(
        'INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)',
        [eventId, userId, 'going']
      );
      
      const [events] = await connection.execute(
        `SELECT e.*, u.first_name as creator_name,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going') as going_count
         FROM events e
         JOIN users u ON e.created_by = u.id
         WHERE e.id = ?`,
        [eventId]
      );
      
      const createdEvent = events[0];
      
      notifyRoomMembers(roomId, createdEvent, userId, 'new_event').catch(err => {
        console.error('Ошибка отправки уведомлений:', err);
      });
      
      res.json({
        success: true,
        event: createdEvent
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка создания события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;