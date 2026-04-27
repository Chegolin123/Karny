// C:\OSPanel\domains\karny\backend\src\routes\messages.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');

/**
 * GET /api/rooms/:roomId/messages
 * Получить сообщения комнаты
 */
router.get('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 30;
    const before = req.query.before;
    
    console.log('📨 GET /messages', { roomId, userId, limit, before });
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [members] = await connection.execute(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: 'Вы не участник этой комнаты' });
      }
      
      let query;
      let params;
      
      if (before) {
        query = `
          SELECT m.*, 
                 u.first_name, u.last_name, u.username, u.photo_url,
                 reply_to.content as reply_to_content,
                 reply_to_user.first_name as reply_to_first_name,
                 (SELECT COUNT(*) FROM message_reads WHERE message_id = m.id) as read_count
          FROM messages m
          JOIN users u ON m.user_id = u.id
          LEFT JOIN messages reply_to ON m.reply_to_id = reply_to.id
          LEFT JOIN users reply_to_user ON reply_to.user_id = reply_to_user.id
          WHERE m.room_id = ? AND m.id < ?
          ORDER BY m.is_pinned DESC, m.created_at DESC
          LIMIT ${limit}
        `;
        params = [roomId, before];
      } else {
        query = `
          SELECT m.*, 
                 u.first_name, u.last_name, u.username, u.photo_url,
                 reply_to.content as reply_to_content,
                 reply_to_user.first_name as reply_to_first_name,
                 (SELECT COUNT(*) FROM message_reads WHERE message_id = m.id) as read_count
          FROM messages m
          JOIN users u ON m.user_id = u.id
          LEFT JOIN messages reply_to ON m.reply_to_id = reply_to.id
          LEFT JOIN users reply_to_user ON reply_to.user_id = reply_to_user.id
          WHERE m.room_id = ?
          ORDER BY m.is_pinned DESC, m.created_at DESC
          LIMIT ${limit}
        `;
        params = [roomId];
      }
      
      const [messages] = await connection.execute(query, params);
      
      // Для каждого сообщения получаем вложения
      const messagesWithAttachments = await Promise.all(
        messages.map(async (msg) => {
          const [attachments] = await connection.execute(
            'SELECT * FROM message_attachments WHERE message_id = ?',
            [msg.id]
          );
          return { ...msg, attachments };
        })
      );
      
      // Отмечаем сообщения как прочитанные
      if (messagesWithAttachments.length > 0) {
        for (const msg of messagesWithAttachments) {
          await connection.execute(
            'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)',
            [msg.id, userId]
          );
        }
      }
      
      res.json({ 
        messages: messagesWithAttachments.reverse(),
        hasMore: messages.length === limit
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка получения сообщений:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/rooms/:roomId/messages/:messageId
 * Редактировать сообщение
 */
router.put('/:messageId', async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { content, userId } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      const [messages] = await connection.execute(
        'SELECT user_id FROM messages WHERE id = ? AND room_id = ?',
        [messageId, roomId]
      );
      
      if (messages.length === 0) {
        return res.status(404).json({ error: 'Сообщение не найдено' });
      }
      
      if (messages[0].user_id != userId) {
        return res.status(403).json({ error: 'Вы не можете редактировать это сообщение' });
      }
      
      await connection.execute(
        'UPDATE messages SET content = ?, is_edited = TRUE, edited_at = NOW() WHERE id = ?',
        [content.trim(), messageId]
      );
      
      const [updated] = await connection.execute(
        `SELECT m.*, u.first_name, u.last_name, u.username, u.photo_url
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [messageId]
      );
      
      // Получаем вложения
      const [attachments] = await connection.execute(
        'SELECT * FROM message_attachments WHERE message_id = ?',
        [messageId]
      );
      
      res.json({ 
        success: true, 
        message: { ...updated[0], attachments } 
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка редактирования:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/rooms/:roomId/messages/:messageId
 * Удалить сообщение
 */
router.delete('/:messageId', async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { userId } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        'SELECT owner_id FROM rooms WHERE id = ?',
        [roomId]
      );
      
      const [messages] = await connection.execute(
        'SELECT user_id FROM messages WHERE id = ? AND room_id = ?',
        [messageId, roomId]
      );
      
      if (messages.length === 0) {
        return res.status(404).json({ error: 'Сообщение не найдено' });
      }
      
      const isOwner = rooms[0]?.owner_id == userId;
      const isAuthor = messages[0].user_id == userId;
      
      if (!isOwner && !isAuthor) {
        return res.status(403).json({ error: 'Нет прав на удаление' });
      }
      
      await connection.execute('DELETE FROM messages WHERE id = ?', [messageId]);
      
      res.json({ success: true, message: 'Сообщение удалено' });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка удаления:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rooms/:roomId/messages/:messageId/pin
 * Закрепить/открепить сообщение (только админ)
 */
router.post('/:messageId/pin', async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { userId } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        'SELECT owner_id FROM rooms WHERE id = ?',
        [roomId]
      );
      
      if (rooms[0]?.owner_id != userId) {
        return res.status(403).json({ error: 'Только админ может закреплять сообщения' });
      }
      
      const [messages] = await connection.execute(
        'SELECT is_pinned FROM messages WHERE id = ? AND room_id = ?',
        [messageId, roomId]
      );
      
      if (messages.length === 0) {
        return res.status(404).json({ error: 'Сообщение не найдено' });
      }
      
      const newState = !messages[0].is_pinned;
      
      if (newState) {
        await connection.execute(
          'UPDATE messages SET is_pinned = 1, pinned_at = NOW(), pinned_by = ? WHERE id = ?',
          [userId, messageId]
        );
      } else {
        await connection.execute(
          'UPDATE messages SET is_pinned = 0, pinned_at = NULL, pinned_by = NULL WHERE id = ?',
          [messageId]
        );
      }
      
      res.json({ success: true, is_pinned: newState });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка закрепления:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;