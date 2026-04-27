// C:\OSPanel\domains\karny\backend\src\routes\rooms\transfer.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * POST /api/rooms/:id/transfer
 * Передать права владельца комнаты
 */
router.post('/:id/transfer', async (req, res) => {
  try {
    const roomId = req.params.id;
    const { userId, newOwnerId } = req.body;
    
    if (!userId || !newOwnerId) {
      return res.status(400).json({ error: 'userId и newOwnerId обязательны' });
    }
    
    if (userId == newOwnerId) {
      return res.status(400).json({ error: 'Нельзя передать права самому себе' });
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
        return res.status(403).json({ error: 'Только владелец может передать права' });
      }
      
      const [members] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, newOwnerId]
      );
      
      if (members.length === 0) {
        return res.status(400).json({ error: 'Новый владелец должен быть участником комнаты' });
      }
      
      await connection.execute(
        'UPDATE rooms SET owner_id = ?, updated_at = NOW() WHERE id = ?',
        [newOwnerId, roomId]
      );
      
      res.json({ 
        success: true, 
        message: 'Права переданы' 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка передачи прав:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;