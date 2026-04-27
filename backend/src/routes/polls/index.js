// C:\OSPanel\domains\karny\backend\src\routes\polls\index.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * GET /api/rooms/:roomId/polls
 * Получить все опросы комнаты
 */
router.get('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.query.userId;
    
    const connection = await pool.getConnection();
    
    try {
      // Получаем все опросы комнаты
      const [polls] = await connection.execute(
        `SELECT p.*, u.first_name, u.last_name, u.username, u.photo_url
         FROM polls p
         JOIN users u ON p.created_by = u.id
         WHERE p.room_id = ?
         ORDER BY p.created_at DESC`,
        [roomId]
      );
      
      // Для каждого опроса получаем варианты и голоса
      const fullPolls = await Promise.all(polls.map(async (poll) => {
        const [options] = await connection.execute(
          'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id',
          [poll.id]
        );
        
        const [votes] = await connection.execute(
          `SELECT pv.*, u.first_name, u.username 
           FROM poll_votes pv
           JOIN users u ON pv.user_id = u.id
           WHERE pv.poll_id = ?`,
          [poll.id]
        );
        
        // Подсчёт голосов
        const voteCounts = {};
        options.forEach(opt => voteCounts[opt.id] = 0);
        votes.forEach(v => voteCounts[v.option_id]++);
        
        const userVotes = votes.filter(v => v.user_id == userId).map(v => v.option_id);
        
        return {
          ...poll,
          options: options.map(opt => ({
            ...opt,
            vote_count: voteCounts[opt.id] || 0
          })),
          votes: poll.is_anonymous ? [] : votes,
          user_votes: userVotes,
          total_votes: votes.length
        };
      }));
      
  const { broadcastToRoom } = require("../../utils/broadcastRoom");
  broadcastToRoom(roomId, { type: "polls_changed", roomId });
      res.json({ polls: fullPolls });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка получения опросов:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rooms/:roomId/polls
 * Создать опрос
 */
router.post('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { question, options, isAnonymous, isMultiple, userId } = req.body;
    
    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: 'Вопрос должен быть не менее 3 символов' });
    }
    
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Нужно минимум 2 варианта ответа' });
    }
    
    if (options.length > 10) {
      return res.status(400).json({ error: 'Максимум 10 вариантов ответа' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Создаём опрос
      const [pollResult] = await connection.execute(
        `INSERT INTO polls (room_id, created_by, question, is_anonymous, is_multiple) 
         VALUES (?, ?, ?, ?, ?)`,
        [roomId, userId, question.trim(), isAnonymous || false, isMultiple || false]
      );
      
      const pollId = pollResult.insertId;
      
      // Добавляем варианты
      for (const optionText of options) {
        if (optionText && optionText.trim()) {
          await connection.execute(
            'INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)',
            [pollId, optionText.trim()]
          );
        }
      }
      
      await connection.commit();
      
      // Получаем полный опрос
      const [polls] = await connection.execute(
        `SELECT p.*, u.first_name, u.last_name, u.username, u.photo_url
         FROM polls p
         JOIN users u ON p.created_by = u.id
         WHERE p.id = ?`,
        [pollId]
      );
      
      const [pollOptions] = await connection.execute(
        'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id',
        [pollId]
      );
      
      const poll = {
        ...polls[0],
        options: pollOptions,
        votes: [],
        total_votes: 0,
        user_votes: []
      };
      
  const { broadcastToRoom } = require("../../utils/broadcastRoom");
  broadcastToRoom(roomId, { type: "polls_changed", roomId });
      res.json({ success: true, poll });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка создания опроса:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rooms/:roomId/polls/:pollId
 * Получить опрос
 */
router.get('/:pollId', async (req, res) => {
  try {
    const { roomId, pollId } = req.params;
    const userId = req.query.userId;
    
    const connection = await pool.getConnection();
    
    try {
      const [polls] = await connection.execute(
        `SELECT p.*, u.first_name, u.last_name, u.username, u.photo_url
         FROM polls p
         JOIN users u ON p.created_by = u.id
         WHERE p.id = ? AND p.room_id = ?`,
        [pollId, roomId]
      );
      
      if (polls.length === 0) {
        return res.status(404).json({ error: 'Опрос не найден' });
      }
      
      const [pollOptions] = await connection.execute(
        'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id',
        [pollId]
      );
      
      const [votes] = await connection.execute(
        `SELECT pv.*, u.first_name, u.username 
         FROM poll_votes pv
         JOIN users u ON pv.user_id = u.id
         WHERE pv.poll_id = ?`,
        [pollId]
      );
      
      // Подсчёт голосов по вариантам
      const voteCounts = {};
      pollOptions.forEach(opt => voteCounts[opt.id] = 0);
      votes.forEach(v => voteCounts[v.option_id]++);
      
      const userVotes = votes.filter(v => v.user_id == userId).map(v => v.option_id);
      
      const poll = {
        ...polls[0],
        options: pollOptions.map(opt => ({
          ...opt,
          vote_count: voteCounts[opt.id] || 0
        })),
        votes: polls[0].is_anonymous ? [] : votes,
        user_votes: userVotes,
        total_votes: votes.length
      };
      
  const { broadcastToRoom } = require("../../utils/broadcastRoom");
  broadcastToRoom(roomId, { type: "polls_changed", roomId });
      res.json({ poll });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка получения опроса:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rooms/:roomId/polls/:pollId/vote
 * Проголосовать
 */
router.post('/:pollId/vote', async (req, res) => {
  try {
    const { roomId, pollId } = req.params;
    const { optionIds, userId } = req.body;
    
    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({ error: 'Выберите вариант ответа' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Проверяем, не закрыт ли опрос
      const [polls] = await connection.execute(
        'SELECT is_closed, is_multiple FROM polls WHERE id = ? AND room_id = ?',
        [pollId, roomId]
      );
      
      if (polls.length === 0) {
        return res.status(404).json({ error: 'Опрос не найден' });
      }
      
      if (polls[0].is_closed) {
        return res.status(400).json({ error: 'Опрос закрыт' });
      }
      
      // Если не множественный выбор — берём только первый вариант
      const votesToAdd = polls[0].is_multiple ? optionIds : [optionIds[0]];
      
      await connection.beginTransaction();
      
      // Удаляем старые голоса
      await connection.execute(
        'DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?',
        [pollId, userId]
      );
      
      // Добавляем новые
      for (const optionId of votesToAdd) {
        await connection.execute(
          'INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)',
          [pollId, optionId, userId]
        );
      }
      
      await connection.commit();
      
      res.json({ success: true, message: 'Голос учтён' });
  const { broadcastToRoom } = require("../../utils/broadcastRoom");
  broadcastToRoom(roomId, { type: "poll_voted", roomId, pollId });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка голосования:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rooms/:roomId/polls/:pollId/close
 * Закрыть опрос (только создатель или админ)
 */
router.post('/:pollId/close', async (req, res) => {
  try {
    const { roomId, pollId } = req.params;
    const { userId } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      // Проверяем права
      const [polls] = await connection.execute(
        'SELECT created_by FROM polls WHERE id = ? AND room_id = ?',
        [pollId, roomId]
      );
      
      if (polls.length === 0) {
        return res.status(404).json({ error: 'Опрос не найден' });
      }
      
      const [rooms] = await connection.execute(
        'SELECT owner_id FROM rooms WHERE id = ?',
        [roomId]
      );
      
      const isOwner = rooms[0]?.owner_id == userId;
      const isCreator = polls[0].created_by == userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ error: 'Нет прав на закрытие опроса' });
      }
      
      await connection.execute(
        'UPDATE polls SET is_closed = 1, closed_at = NOW() WHERE id = ?',
        [pollId]
      );
      
      res.json({ success: true, message: 'Опрос закрыт' });
  const { broadcastToRoom } = require("../../utils/broadcastRoom");
  broadcastToRoom(roomId, { type: "poll_closed", roomId, pollId });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка закрытия опроса:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;