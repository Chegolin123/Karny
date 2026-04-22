// C:\OSPanel\domains\karny\backend\src\routes\events\timeOptions.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * GET /api/rooms/:roomId/events/:eventId/time-options
 * Получить все варианты времени с количеством голосов
 */
router.get('/time-options', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.query.userId;
    
    const connection = await pool.getConnection();
    
    try {
      // Получаем варианты с подсчётом голосов
      const [options] = await connection.execute(
        `SELECT 
           o.id, 
           o.proposed_date, 
           o.created_by,
           u.first_name as creator_name,
           COUNT(v.user_id) as votes_count,
           (SELECT COUNT(*) FROM event_time_votes WHERE option_id = o.id AND user_id = ?) as user_voted
         FROM event_time_options o
         JOIN users u ON o.created_by = u.id
         LEFT JOIN event_time_votes v ON o.id = v.option_id
         WHERE o.event_id = ?
         GROUP BY o.id
         ORDER BY votes_count DESC, o.created_at ASC`,
        [userId || 0, eventId]
      );
      
      res.json({ options });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения вариантов времени:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/rooms/:roomId/events/:eventId/time-options
 * Предложить новый вариант времени
 */
router.post('/time-options', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { proposedDate, userId } = req.body;
    
    if (!proposedDate) {
      return res.status(400).json({ error: 'Дата обязательна' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Проверяем, что событие с голосованием
      const [events] = await connection.execute(
        'SELECT time_voting_enabled FROM events WHERE id = ?',
        [eventId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      if (!events[0].time_voting_enabled) {
        return res.status(400).json({ error: 'Голосование отключено для этого события' });
      }
      
      // Добавляем вариант
      const [result] = await connection.execute(
        'INSERT INTO event_time_options (event_id, proposed_date, created_by) VALUES (?, ?, ?)',
        [eventId, proposedDate, userId]
      );
      
      const optionId = result.insertId;
      
      // Автоматически голосуем за свой вариант
      await connection.execute(
        'INSERT INTO event_time_votes (option_id, user_id) VALUES (?, ?)',
        [optionId, userId]
      );
      
      // Получаем созданный вариант с подсчётом голосов
      const [options] = await connection.execute(
        `SELECT 
           o.id, 
           o.proposed_date, 
           o.created_by,
           u.first_name as creator_name,
           COUNT(v.user_id) as votes_count,
           1 as user_voted
         FROM event_time_options o
         JOIN users u ON o.created_by = u.id
         LEFT JOIN event_time_votes v ON o.id = v.option_id
         WHERE o.id = ?
         GROUP BY o.id`,
        [optionId]
      );
      
      res.json({
        success: true,
        option: options[0]
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка добавления варианта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * DELETE /api/rooms/:roomId/events/:eventId/time-options/:optionId
 * Удалить вариант времени (только создатель варианта или админ)
 */
router.delete('/time-options/:optionId', async (req, res) => {
  try {
    const { roomId, eventId, optionId } = req.params;
    const { userId } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      // Проверяем права
      const [rooms] = await connection.execute(
        'SELECT owner_id FROM rooms WHERE id = ?',
        [roomId]
      );
      
      const [options] = await connection.execute(
        'SELECT created_by FROM event_time_options WHERE id = ? AND event_id = ?',
        [optionId, eventId]
      );
      
      if (options.length === 0) {
        return res.status(404).json({ error: 'Вариант не найден' });
      }
      
      const isOwner = rooms[0]?.owner_id == userId;
      const isCreator = options[0].created_by == userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ error: 'Нет прав на удаление' });
      }
      
      await connection.execute(
        'DELETE FROM event_time_options WHERE id = ?',
        [optionId]
      );
      
      res.json({ success: true, message: 'Вариант удалён' });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка удаления варианта:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;