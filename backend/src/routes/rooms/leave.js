// C:\OSPanel\domains\karny\backend\src\routes\rooms\leave.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

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
          error: 'Владелец не может покинуть комнату. Передайте права или удалите комнату.' 
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

module.exports = router;