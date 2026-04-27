// C:\OSPanel\domains\karny\backend\src\routes\rooms\get.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

/**
 * GET /api/rooms/:id
 * Получить информацию о конкретной комнате
 */
router.get('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.query.userId || 1;
    
    const connection = await pool.getConnection();
    
    try {
      // Получаем информацию о комнате
      const [rooms] = await connection.execute(
        `SELECT r.*, u.first_name as owner_name 
         FROM rooms r 
         JOIN users u ON r.owner_id = u.id 
         WHERE r.id = ?`,
        [roomId]
      );
      
      if (rooms.length === 0) {
        return res.status(404).json({ error: 'Комната не найдена' });
      }
      
      const room = rooms[0];
      
      // Проверяем, является ли пользователь участником
      const [members] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      const isMember = members.length > 0;
      const isOwner = room.owner_id == userId;
      
      // Если комната публичная и пользователь не участник — разрешаем просмотр
      // Если приватная и не участник — запрещаем
      if (!isMember && !isOwner && room.is_private) {
        return res.status(403).json({ 
          error: 'Это приватная комната. Введите пароль для входа.',
          requiresPassword: true 
        });
      }
      
      // Получаем список участников
      const [membersList] = await connection.execute(
        `SELECT u.id, u.username, u.first_name, u.last_name, u.photo_url,
                rm.joined_at
         FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = ?
         ORDER BY rm.joined_at`,
        [roomId]
      );
      
      // Получаем события
      const [events] = await connection.execute(
        `SELECT e.*, 
                u.first_name as creator_name,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going') as going_count,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'maybe') as maybe_count,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'declined') as declined_count
         FROM events e
         JOIN users u ON e.created_by = u.id
         WHERE e.room_id = ?
         ORDER BY 
           e.time_voting_enabled DESC,
           e.created_at DESC`,
        [roomId]
      );
      
      // Не возвращаем пароль в ответе
      delete room.password;
      
      res.json({
        room,
        members: membersList,
        events,
        isMember,
        isOwner
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;