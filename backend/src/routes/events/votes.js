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
      // Проверяем, существует ли вариант
      const [options] = await connection.execute(
        'SELECT id FROM event_time_options WHERE id = ? AND event_id = ?',
        [optionId, eventId]
      );
      
      if (options.length === 0) {
        return res.status(404).json({ error: 'Вариант не найден' });
      }
      
      // Проверяем, голосовал ли уже пользователь
      const [existing] = await connection.execute(
        'SELECT * FROM event_time_votes WHERE option_id = ? AND user_id = ?',
        [optionId, userId]
      );
      
      if (existing.length > 0) {
        // Снимаем голос
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
        // Добавляем голос
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
      // Проверяем права
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
      
      // Получаем выбранный вариант
      const [options] = await connection.execute(
        'SELECT proposed_date FROM event_time_options WHERE id = ? AND event_id = ?',
        [optionId, eventId]
      );
      
      if (options.length === 0) {
        return res.status(404).json({ error: 'Вариант не найден' });
      }
      
      // Обновляем событие
      await connection.execute(
        'UPDATE events SET event_date = ?, time_voting_enabled = FALSE WHERE id = ?',
        [options[0].proposed_date, eventId]
      );
      
      // Удаляем все варианты голосования
      await connection.execute(
        'DELETE FROM event_time_options WHERE event_id = ?',
        [eventId]
      );
      
      res.json({ 
        success: true, 
        message: 'Время выбрано',
        eventDate: options[0].proposed_date
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