// C:\OSPanel\domains\karny\backend\src\routes\events\delete.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * DELETE /api/rooms/:roomId/events/:eventId
 * Удалить событие (только создатель или админ)
 */
router.delete('/:eventId', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
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
      
      const [events] = await connection.execute(
        'SELECT created_by FROM events WHERE id = ? AND room_id = ?',
        [eventId, roomId]
      );
      
      if (events.length === 0) {
        return res.status(404).json({ error: 'Событие не найдено' });
      }
      
      const isOwner = rooms[0].owner_id == userId;
      const isCreator = events[0].created_by == userId;
      
      if (!isOwner && !isCreator) {
        return res.status(403).json({ error: 'Только создатель или админ может удалить событие' });
      }
      
      await connection.execute('DELETE FROM events WHERE id = ?', [eventId]);
      
  const { broadcastToRoom } = require("../../utils/broadcastRoom");
  broadcastToRoom(roomId, { type: "events_changed", roomId });
      res.json({ success: true, message: 'Событие удалено' });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка удаления события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
