// C:\OSPanel\domains\karny\backend\src\routes\rooms\join.js

const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const bcrypt = require('bcrypt');
const { invalidateUserCache, clearCachePattern } = require('../../services/cacheService');

/**
 * POST /api/rooms/join
 * Присоединиться к комнате по коду
 */
router.post('/', async (req, res) => {
  try {
    const { code, password } = req.body;
    const userId = req.body.userId || 1;
    
    console.log('========================================');
    console.log('📨 POST /api/rooms/join');
    console.log('code:', code);
    console.log('userId:', userId);
    console.log('hasPassword:', !!password);
    console.log('========================================');
    
    if (!code) {
      console.log('❌ Ошибка: код не указан');
      return res.status(400).json({ error: 'Код комнаты обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        'SELECT * FROM rooms WHERE code = ?',
        [code.toUpperCase()]
      );
      
      console.log('🔍 Найдено комнат:', rooms.length);
      
      if (rooms.length === 0) {
        console.log('❌ Комната не найдена');
        return res.status(404).json({ error: 'Комната не найдена' });
      }
      
      const room = rooms[0];
      console.log('✅ Комната найдена:', { id: room.id, name: room.name, is_private: room.is_private });
      
      if (room.is_private) {
        console.log('🔒 Комната приватная, проверяем пароль');
        
        if (!password) {
          console.log('❌ Пароль не указан');
          return res.status(403).json({ 
            error: 'Требуется пароль',
            requiresPassword: true 
          });
        }
        
        const validPassword = await bcrypt.compare(password, room.password);
        console.log('🔐 Пароль верный:', validPassword);
        
        if (!validPassword) {
          console.log('❌ Неверный пароль');
          return res.status(403).json({ error: 'Неверный пароль' });
        }
      }
      
      const [existing] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [room.id, userId]
      );
      
      console.log('👤 Пользователь уже участник:', existing.length > 0);
      
      if (existing.length > 0) {
        delete room.password;
        console.log('📤 Отправка ответа: уже участник');
        return res.json({
          success: true,
          message: 'Вы уже участник',
          room,
          alreadyMember: true
        });
      }
      
      await connection.execute(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [room.id, userId]
      );
      
      console.log('✅ Пользователь добавлен в room_members');
      
      await invalidateUserCache(userId);
      await clearCachePattern('rooms:list:*');
      
      delete room.password;
      
      console.log('📤 Отправка ответа: успешное присоединение');
      console.log('========================================\n');
      
      res.json({
        success: true,
        message: 'Вы присоединились к комнате',
        room,
        alreadyMember: false
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка в join.js:', error);
    console.error('Stack:', error.stack);
    console.log('========================================\n');
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;