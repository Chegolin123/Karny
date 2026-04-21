// C:\OSPanel\domains\karny\backend\src\routes\rooms.js

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { generateRoomCode } = require('../utils/telegramAuth');

/**
 * GET /api/rooms
 * Получить список комнат пользователя
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        `SELECT r.*, 
                COUNT(DISTINCT rm.user_id) as members_count,
                u.first_name as owner_name
         FROM rooms r
         JOIN room_members rm ON r.id = rm.room_id
         JOIN users u ON r.owner_id = u.id
         WHERE rm.user_id = ?
         GROUP BY r.id
         ORDER BY r.updated_at DESC`,
        [userId]
      );
      
      res.json({ rooms });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения комнат:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/rooms
 * Создать новую комнату
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.body.userId || 1;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название комнаты должно быть не менее 3 символов' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      let code;
      let codeExists = true;
      while (codeExists) {
        code = generateRoomCode();
        const [existing] = await connection.execute(
          'SELECT id FROM rooms WHERE code = ?',
          [code]
        );
        codeExists = existing.length > 0;
      }
      
      const [result] = await connection.execute(
        'INSERT INTO rooms (name, code, owner_id) VALUES (?, ?, ?)',
        [name.trim(), code, userId]
      );
      
      const roomId = result.insertId;
      
      await connection.execute(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, userId]
      );
      
      await connection.commit();
      
      const [rooms] = await connection.execute(
        `SELECT r.*, u.first_name as owner_name 
         FROM rooms r 
         JOIN users u ON r.owner_id = u.id 
         WHERE r.id = ?`,
        [roomId]
      );
      
      res.json({
        success: true,
        room: rooms[0]
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка создания комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * GET /api/rooms/:id
 * Получить информацию о конкретной комнате
 */
router.get('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.query.userId || 1;
    
    const connection = await pool.getConnection();
    
    try {
      const [members] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: 'Вы не участник этой комнаты' });
      }
      
      const [rooms] = await connection.execute(
        `SELECT r.*, u.first_name as owner_name 
         FROM rooms r 
         JOIN users u ON r.owner_id = u.id 
         WHERE r.id = ?`,
        [roomId]
      );
      
      if (rooms.length === 0) {
        return res.status(404).json({ error: 'Комната не найдена' });
      }
      
      const [membersList] = await connection.execute(
        `SELECT u.id, u.username, u.first_name, u.last_name, u.photo_url,
                rm.joined_at
         FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = ?
         ORDER BY rm.joined_at`,
        [roomId]
      );
      
      const [events] = await connection.execute(
        `SELECT e.*, 
                u.first_name as creator_name,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going') as going_count,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'maybe') as maybe_count,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'declined') as declined_count
         FROM events e
         JOIN users u ON e.created_by = u.id
         WHERE e.room_id = ?
         ORDER BY e.event_date`,
        [roomId]
      );
      
      res.json({
        room: rooms[0],
        members: membersList,
        events
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * PUT /api/rooms/:id
 * Обновить комнату (только владелец)
 */
router.put('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const { name, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название комнаты должно быть не менее 3 символов' });
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
      
      if (rooms[0].owner_id != userId) {
        return res.status(403).json({ error: 'Только владелец может редактировать комнату' });
      }
      
      await connection.execute(
        'UPDATE rooms SET name = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), roomId]
      );
      
      const [updatedRooms] = await connection.execute(
        `SELECT r.*, u.first_name as owner_name 
         FROM rooms r 
         JOIN users u ON r.owner_id = u.id 
         WHERE r.id = ?`,
        [roomId]
      );
      
      res.json({
        success: true,
        room: updatedRooms[0],
        message: 'Комната обновлена'
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка обновления комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/rooms/join
 * Присоединиться к комнате по коду
 */
router.post('/join', async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.body.userId || 1;
    
    if (!code) {
      return res.status(400).json({ error: 'Код комнаты обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        'SELECT * FROM rooms WHERE code = ?',
        [code.toUpperCase()]
      );
      
      if (rooms.length === 0) {
        return res.status(404).json({ error: 'Комната не найдена' });
      }
      
      const room = rooms[0];
      
      const [existing] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [room.id, userId]
      );
      
      if (existing.length > 0) {
        return res.json({
          success: true,
          message: 'Вы уже участник',
          room
        });
      }
      
      await connection.execute(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [room.id, userId]
      );
      
      res.json({
        success: true,
        message: 'Вы присоединились к комнате',
        room
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка присоединения к комнате:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /api/rooms/:id/leave
 * Покинуть комнату
 */
router.post('/:id/leave', async (req, res) => {
  try {
    const roomId = req.params.id;
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
      
      if (rooms[0].owner_id == userId) {
        return res.status(400).json({ 
          error: 'Владелец не может покинуть комнату. Удалите комнату вместо этого.' 
        });
      }
      
      const [result] = await connection.execute(
        'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Вы не участник этой комнаты' });
      }
      
      res.json({ 
        success: true, 
        message: 'Вы покинули комнату' 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка выхода из комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * DELETE /api/rooms/:id
 * Удалить комнату (только владелец)
 */
router.delete('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
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
      
      if (rooms[0].owner_id != userId) {
        return res.status(403).json({ error: 'Только владелец может удалить комнату' });
      }
      
      await connection.execute(
        'DELETE FROM rooms WHERE id = ?',
        [roomId]
      );
      
      res.json({ 
        success: true, 
        message: 'Комната удалена' 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка удаления комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;