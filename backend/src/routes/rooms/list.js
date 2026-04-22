// C:\OSPanel\domains\karny\backend\src\routes\rooms\list.js

const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { cacheMiddleware } = require('../../services/cacheService');

/**
 * GET /api/rooms
 * Получить список комнат пользователя
 */
router.get('/', cacheMiddleware('rooms:list', 10), async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const type = req.query.type || 'my';
    
    console.log('📨 GET /rooms', { userId, type });
    
    const connection = await pool.getConnection();
    
    try {
      let query;
      let params;
      
      if (type === 'public') {
        query = `
          SELECT r.*, 
                 (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as members_count,
                 u.first_name as owner_name,
                 EXISTS(SELECT 1 FROM room_members WHERE room_id = r.id AND user_id = ?) as is_member
          FROM rooms r
          JOIN users u ON r.owner_id = u.id
          WHERE r.is_private = FALSE 
            AND r.is_public_listed = TRUE
          ORDER BY r.updated_at DESC
        `;
        params = [userId];
      } else if (type === 'my') {
        query = `
          SELECT r.*, 
                 (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as members_count,
                 u.first_name as owner_name,
                 TRUE as is_member
          FROM rooms r
          JOIN room_members rm ON r.id = rm.room_id
          JOIN users u ON r.owner_id = u.id
          WHERE rm.user_id = ?
          GROUP BY r.id
          ORDER BY r.updated_at DESC
        `;
        params = [userId];
      } else {
        query = `
          (SELECT r.*, 
                  (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as members_count,
                  u.first_name as owner_name,
                  TRUE as is_member
           FROM rooms r
           JOIN room_members rm ON r.id = rm.room_id
           JOIN users u ON r.owner_id = u.id
           WHERE rm.user_id = ?
           GROUP BY r.id)
          UNION
          (SELECT r.*,
                  (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as members_count,
                  u.first_name as owner_name,
                  FALSE as is_member
           FROM rooms r
           JOIN users u ON r.owner_id = u.id
           WHERE r.is_private = FALSE 
             AND r.is_public_listed = TRUE
             AND r.id NOT IN (
               SELECT room_id FROM room_members WHERE user_id = ?
             ))
          ORDER BY updated_at DESC
        `;
        params = [userId, userId];
      }
      
      const [rooms] = await connection.execute(query, params);
      
      console.log(`📨 Найдено комнат: ${rooms.length}`);
      
      rooms.forEach(room => delete room.password);
      
      res.json({ rooms, type });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Ошибка получения комнат:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;