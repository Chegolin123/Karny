const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');
const { getWebSocketServer } = require('../../websocket');

router.post('/:eventId/start-session', async (req, res) => {
  try {
    const { roomId, eventId } = req.params;
    const userId = req.body.userId;
    
    const connection = await pool.getConnection();
    try {
      const [rooms] = await connection.execute('SELECT owner_id FROM rooms WHERE id = ?', [roomId]);
      const [events] = await connection.execute('SELECT created_by FROM events WHERE id = ?', [eventId]);
      
      if (events.length === 0) return res.status(404).json({ error: 'Событие не найдено' });
      
      const isOwner = rooms[0]?.owner_id == userId;
      const isCreator = events[0].created_by == userId;
      if (!isOwner && !isCreator) return res.status(403).json({ error: 'Только админ' });

      const now = new Date();
      await connection.execute(
        "UPDATE events SET video_state = 'live', session_started_at = ? WHERE id = ?",
        [now, eventId]
      );

      // Отправляем WebSocket сразу (без задержки)
      const wss = getWebSocketServer();
      if (wss) {
        wss.clients.forEach(client => {
          if (client.roomId == roomId && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'video_session_started',
              eventId,
              roomId,
              startedAt: now.toISOString()
            }));
          }
        });
      }
      
      res.json({ success: true, video_state: 'live', startedAt: now.toISOString() });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Ошибка запуска сеанса:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
