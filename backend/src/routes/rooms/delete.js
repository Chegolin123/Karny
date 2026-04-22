// C:\OSPanel\domains\karny\backend\src\routes\rooms\delete.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

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