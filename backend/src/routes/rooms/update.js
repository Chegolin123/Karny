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
    const { name, userId, photo_url } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    // Если передано название — валидируем его
    if (name !== undefined && name.trim().length < 3) {
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
      
      // Обновляем только те поля, которые переданы
      const updates = [];
      const values = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name.trim());
      }
      
      if (photo_url !== undefined) {
        updates.push('photo_url = ?');
        values.push(photo_url);
      }
      
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(roomId);
        
        await connection.execute(
          `UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
      
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

module.exports = router;// В конце, перед res.json, добавим:
const { getWebSocketServer } = require('../../websocket');
const wss = getWebSocketServer();
if (wss) {
  wss.clients.forEach(client => {
    if (client.roomId == roomId && client.readyState === 1) {
      client.send(JSON.stringify({ type: 'room_updated', roomId }));
    }
  });
}
