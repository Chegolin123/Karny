// C:\OSPanel\domains\karny\backend\src\routes\events.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');
const { notifyRoomMembers, sendEventReminder } = require('../services/notificationService');

/**
 * POST /api/rooms/:roomId/events
 * Создать новое событие в комнате
 */
router.post('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { name, description, eventDate } = req.body;
    const userId = req.body.userId || 1;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название события должно быть не менее 3 символов' });
    }
    
    if (!eventDate) {
      return res.status(400).json({ error: 'Дата события обязательна' });
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
        'INSERT INTO events (room_id, name, description, event_date, created_by) VALUES (?, ?, ?, ?, ?)',
        [roomId, name.trim(), description || null, eventDate, userId]
      );
      
      const eventId = result.insertId;
      
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
    console.error('Ошибка создания события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * PUT /api/rooms/:roomId/events/:eventId
 * Обновить событие (только админ или создатель)
 */
router.put('/:eventId', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const { name, description, eventDate, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название события должно быть не менее 3 символов' });
    }
    
    if (!eventDate) {
      return res.status(400).json({ error: 'Дата события обязательна' });
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
        'UPDATE events SET name = ?, description = ?, event_date = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), description || null, eventDate, eventId]
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
    console.error('Ошибка обновления события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

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
      
      res.json({
        going,
        maybe,
        declined,
        total: attendees.length
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения участников:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/rooms/:roomId/events/:eventId/remind
 * Отправить напоминание о событии
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
        message: `Напоминания отправлены`,
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
      
      res.json({
        success: true,
        message: 'Статус обновлён'
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка отметки участия:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

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
      
      res.json({ 
        status: attendees.length > 0 ? attendees[0].status : null 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения статуса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * DELETE /api/rooms/:roomId/events/:eventId
 * Удалить событие (только создатель или админ)
 */
router.delete('/:eventId', async (req, res) => {
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
        'SELECT created_by FROM events WHERE id = ? AND room_id = ?',
        [eventId, roomId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      const isOwner = rooms[0].owner_id == userId;
      const isCreator = events[0].created_by == userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ error: 'Только создатель или админ может удалить событие' });
      }
      
      await connection.execute(
        'DELETE FROM events WHERE id = ?',
        [eventId]
      );
      
      res.json({ 
        success: true, 
        message: 'Событие удалено' 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка удаления события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;