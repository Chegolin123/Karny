// C:\OSPanel\domains\karny\backend\src\routes\events\votes.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * POST /api/rooms/:roomId/events/:eventId/vote
 * Проголосовать за вариант (или снять голос)
 */
router.post('/vote', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { optionId, userId } = req.body;
    
    if (!optionId) {
      return res.status(400).json({ error: 'optionId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [options] = await connection.execute(
        'SELECT id FROM event_time_options WHERE id = ? AND event_id = ?',
        [optionId, eventId]
      );
      
      if (options.length === 0) {
        return res.status(404).json({ error: 'Вариант не найден' });
      }
      
      const [existing] = await connection.execute(
        'SELECT * FROM event_time_votes WHERE option_id = ? AND user_id = ?',
        [optionId, userId]
      );
      
      if (existing.length > 0) {
        await connection.execute(
          'DELETE FROM event_time_votes WHERE option_id = ? AND user_id = ?',
          [optionId, userId]
        );
        
        res.json({ 
          success: true, 
          voted: false,
          message: 'Голос снят' 
        });
      } else {
        await connection.execute(
          'INSERT INTO event_time_votes (option_id, user_id) VALUES (?, ?)',
          [optionId, userId]
        );
        
        res.json({ 
          success: true, 
          voted: true,
          message: 'Голос учтён' 
        });
      }
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка голосования:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/rooms/:roomId/events/:eventId/select-time
 * Выбрать победившее время (только админ/создатель)
 */
router.post('/select-time', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const { optionId, userId } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        'SELECT owner_id FROM rooms WHERE id = ?',
        [roomId]
      );
      
      const [events] = await connection.execute(
        'SELECT created_by FROM events WHERE id = ?',
        [eventId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      const isOwner = rooms[0]?.owner_id == userId;
      const isCreator = events[0].created_by == userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ error: 'Только админ или создатель может выбрать время' });
      }
      
      const [options] = await connection.execute(
        'SELECT proposed_date FROM event_time_options WHERE id = ? AND event_id = ?',
        [optionId, eventId]
      );
      
      if (options.length === 0) {
        return res.status(404).json({ error: 'Вариант не найден' });
      }
      
      await connection.execute(
        'UPDATE events SET event_date = ?, time_voting_enabled = FALSE WHERE id = ?',
        [options[0].proposed_date, eventId]
      );
      
      await connection.execute(
        'DELETE FROM event_time_options WHERE event_id = ?',
        [eventId]
      );
      
      const [updatedEvents] = await connection.execute(
        `SELECT e.*, u.first_name as creator_name,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going') as going_count
         FROM events e
         JOIN users u ON e.created_by = u.id
         WHERE e.id = ?`,
        [eventId]
      );
      
      const updatedEvent = updatedEvents[0];
      
      const { getWebSocketServer } = require('../../websocket');
      const wss = getWebSocketServer();
      
      if (wss) {
        wss.clients.forEach((client) => {
          if (client.roomId === roomId && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'event_time_selected',
              eventId: parseInt(eventId),
              eventDate: options[0].proposed_date,
              roomId: roomId
            }));
          }
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Время выбрано',
        eventDate: options[0].proposed_date,
        event: updatedEvent
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка выбора времени:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;