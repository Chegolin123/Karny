// C:\OSPanel\domains\karny\backend\src\routes\rooms\create.js

const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { generateRoomCode } = require('../../utils/telegramAuth');
const bcrypt = require('bcrypt');
const { invalidateUserCache, clearCachePattern } = require('../../services/cacheService');

/**
 * POST /api/rooms
 * Создать новую комнату
 */
router.post('/', async (req, res) => {
  try {
    const { name, isPrivate, password } = req.body;
    const userId = req.body.userId || 1;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название комнаты должно быть не менее 3 символов' });
    }
    
    if (isPrivate && (!password || password.length < 4)) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 4 символов' });
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
      
      let hashedPassword = null;
      if (isPrivate && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      
      const [result] = await connection.execute(
        'INSERT INTO rooms (name, code, owner_id, is_private, password, is_public_listed) VALUES (?, ?, ?, ?, ?, ?)',
        [name.trim(), code, userId, isPrivate || false, hashedPassword, true]
      );
      
      const roomId = result.insertId;
      
      await connection.execute(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, userId]
      );
      
      await connection.commit();
      
      await invalidateUserCache(userId);
      await clearCachePattern('rooms:list:*');
      
      const [rooms] = await connection.execute(
        `SELECT r.*, u.first_name as owner_name 
         FROM rooms r 
         JOIN users u ON r.owner_id = u.id 
         WHERE r.id = ?`,
        [roomId]
      );
      
      const room = rooms[0];
      delete room.password;
      
      res.json({
        success: true,
        room
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

module.exports = router;