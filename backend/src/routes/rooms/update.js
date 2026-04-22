// C:\OSPanel\domains\karny\backend\src\routes\rooms\update.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

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

module.exports = router;