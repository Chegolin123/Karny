const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

router.post('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { name, description, eventDate, timeVotingEnabled, videoUrl } = req.body;
    const userId = req.body.userId || 1;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Название события должно быть не менее 3 символов' });
    }
    
    if (!timeVotingEnabled && !eventDate) {
      return res.status(400).json({ error: 'Укажите дату или включите обсуждение времени' });
    }
    
    // Определяем платформу
    let videoPlatform = null;
    if (videoUrl) {
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) videoPlatform = 'youtube';
      else if (videoUrl.includes('rutube.ru')) videoPlatform = 'rutube';
      else if (videoUrl.includes('vk.com') || videoUrl.includes('vkvideo.ru')) videoPlatform = 'vk';
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO events (room_id, name, description, event_date, time_voting_enabled, created_by, video_url, video_platform, video_state) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting')`,
        [roomId, name.trim(), description || null, eventDate || null, timeVotingEnabled ? 1 : 0, userId, videoUrl || null, videoPlatform]
      );
      
      const eventId = result.insertId;
      
      await connection.execute(
        'INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)',
        [eventId, userId, 'going']
      );
      
      const [events] = await connection.execute(
        'SELECT e.*, u.first_name as creator_name FROM events e JOIN users u ON e.created_by = u.id WHERE e.id = ?',
        [eventId]
      );
      
  const { broadcastToRoom } = require("../../utils/broadcastRoom");
  broadcastToRoom(roomId, { type: "events_changed", roomId });
      res.json({ success: true, event: events[0] });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка создания события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
