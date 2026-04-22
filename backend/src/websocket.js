// C:\OSPanel\domains\karny\backend\src\websocket.js

const WebSocket = require('ws');
const { pool } = require('./db');
const { notifyOfflineMembers, updateLastSeen, resetNotificationCounters } = require('./services/chatNotificationService');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  const rooms = new Map();
  const clients = new Map();

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('roomId');
    const userId = url.searchParams.get('userId');

    if (!roomId || !userId) {
      ws.close(1008, 'Missing roomId or userId');
      return;
    }

    try {
      const connection = await pool.getConnection();
      try {
        const [members] = await connection.execute(
          'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
          [roomId, userId]
        );
        
        if (members.length === 0) {
          ws.close(1008, 'User is not a member of this room');
          connection.release();
          return;
        }

        const [users] = await connection.execute(
          'SELECT id, first_name, last_name, username, photo_url FROM users WHERE id = ?',
          [userId]
        );
        
        const user = users[0];
        
        await resetNotificationCounters(roomId, userId);
        await updateLastSeen(roomId, userId);
        
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }
        rooms.get(roomId).set(userId, ws);
        
        clients.set(ws, {
          userId,
          roomId,
          userName: `${user.first_name} ${user.last_name || ''}`.trim(),
          userData: user
        });

        console.log(`✅ User ${userId} (${user.first_name}) connected to room ${roomId}`);

        const [messages] = await connection.execute(
          `SELECT m.*, 
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
           LIMIT 50`,
          [roomId]
        );

        if (messages.length > 0) {
          messages.reverse().forEach(msg => {
            ws.send(JSON.stringify({
              type: 'message',
              id: msg.id,
              roomId: msg.room_id,
              userId: msg.user_id,
              content: msg.content,
              timestamp: msg.created_at,
              is_edited: msg.is_edited,
              edited_at: msg.edited_at,
              is_pinned: msg.is_pinned,
              reply_to_id: msg.reply_to_id,
              reply_to_content: msg.reply_to_content,
              reply_to_first_name: msg.reply_to_first_name,
              read_count: msg.read_count,
              user: {
                id: msg.user_id,
                first_name: msg.first_name,
                last_name: msg.last_name,
                username: msg.username,
                photo_url: msg.photo_url
              }
            }));
          });
        }

        for (const msg of messages) {
          await connection.execute(
            'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)',
            [msg.id, userId]
          );
        }

      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
      return;
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        const clientInfo = clients.get(ws);
        
        if (!clientInfo) return;

        // Обычное сообщение
        if (message.type === 'message') {
          const { content, reply_to_id } = message;
          
          if (!content || content.trim().length === 0) return;
          if (content.length > 2000) return;

          const connection = await pool.getConnection();
          try {
            const [result] = await connection.execute(
              'INSERT INTO messages (room_id, user_id, content, reply_to_id) VALUES (?, ?, ?, ?)',
              [clientInfo.roomId, clientInfo.userId, content.trim(), reply_to_id || null]
            );
            
            const messageId = result.insertId;
            
            const [messages] = await connection.execute(
              `SELECT m.*, 
                      u.first_name, u.last_name, u.username, u.photo_url,
                      reply_to.content as reply_to_content,
                      reply_to_user.first_name as reply_to_first_name
               FROM messages m
               JOIN users u ON m.user_id = u.id
               LEFT JOIN messages reply_to ON m.reply_to_id = reply_to.id
               LEFT JOIN users reply_to_user ON reply_to.user_id = reply_to_user.id
               WHERE m.id = ?`,
              [messageId]
            );
            
            const savedMessage = messages[0];
            
            const messageData = {
              type: 'message',
              id: savedMessage.id,
              roomId: clientInfo.roomId,
              userId: clientInfo.userId,
              content: savedMessage.content,
              timestamp: savedMessage.created_at,
              is_edited: false,
              is_pinned: false,
              reply_to_id: savedMessage.reply_to_id,
              reply_to_content: savedMessage.reply_to_content,
              reply_to_first_name: savedMessage.reply_to_first_name,
              read_count: 0,
              user: {
                id: clientInfo.userId,
                first_name: savedMessage.first_name,
                last_name: savedMessage.last_name,
                username: savedMessage.username,
                photo_url: savedMessage.photo_url
              }
            };
            
            broadcastToRoom(clientInfo.roomId, messageData);
            
            notifyOfflineMembers(
              clientInfo.roomId,
              clientInfo.userId,
              clientInfo.userName
            ).catch(err => {
              console.error('Ошибка отправки уведомлений:', err);
            });
            
          } finally {
            connection.release();
          }
        }
        
        // Редактирование сообщения
        if (message.type === 'edit_message') {
          const { messageId, content } = message;
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;
          
          const connection = await pool.getConnection();
          try {
            const [messages] = await connection.execute(
              'SELECT user_id FROM messages WHERE id = ? AND room_id = ?',
              [messageId, clientInfo.roomId]
            );
            
            if (messages.length > 0 && messages[0].user_id == clientInfo.userId) {
              await connection.execute(
                'UPDATE messages SET content = ?, is_edited = TRUE, edited_at = NOW() WHERE id = ?',
                [content.trim(), messageId]
              );
              
              broadcastToRoom(clientInfo.roomId, {
                type: 'message_edited',
                messageId,
                content: content.trim(),
                edited_at: new Date().toISOString()
              });
            }
          } finally {
            connection.release();
          }
        }
        
        // Удаление сообщения
        if (message.type === 'delete_message') {
          const { messageId } = message;
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;
          
          const connection = await pool.getConnection();
          try {
            const [rooms] = await connection.execute(
              'SELECT owner_id FROM rooms WHERE id = ?',
              [clientInfo.roomId]
            );
            
            const [messages] = await connection.execute(
              'SELECT user_id FROM messages WHERE id = ?',
              [messageId]
            );
            
            if (messages.length > 0) {
              const isOwner = rooms[0]?.owner_id == clientInfo.userId;
              const isAuthor = messages[0].user_id == clientInfo.userId;
              
              if (isOwner || isAuthor) {
                await connection.execute('DELETE FROM messages WHERE id = ?', [messageId]);
                
                broadcastToRoom(clientInfo.roomId, {
                  type: 'message_deleted',
                  messageId
                });
              }
            }
          } finally {
            connection.release();
          }
        }
        
        // Закрепление сообщения
        if (message.type === 'pin_message') {
          const { messageId } = message;
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;
          
          const connection = await pool.getConnection();
          try {
            const [rooms] = await connection.execute(
              'SELECT owner_id FROM rooms WHERE id = ?',
              [clientInfo.roomId]
            );
            
            const isOwner = rooms[0]?.owner_id == clientInfo.userId;
            
            console.log('📌 Pin message request:', {
              messageId,
              userId: clientInfo.userId,
              roomId: clientInfo.roomId,
              isOwner
            });
            
            if (!isOwner) {
              console.log('❌ Отказано: пользователь не админ');
              return;
            }
            
            const [messages] = await connection.execute(
              'SELECT is_pinned FROM messages WHERE id = ?',
              [messageId]
            );
            
            if (messages.length > 0) {
              const newState = !messages[0].is_pinned;
              
              if (newState) {
                await connection.execute(
                  'UPDATE messages SET is_pinned = 1, pinned_at = NOW(), pinned_by = ? WHERE id = ?',
                  [clientInfo.userId, messageId]
                );
              } else {
                await connection.execute(
                  'UPDATE messages SET is_pinned = 0, pinned_at = NULL, pinned_by = NULL WHERE id = ?',
                  [messageId]
                );
              }
              
              console.log(`✅ Сообщение ${messageId} ${newState ? 'закреплено' : 'откреплено'}`);
              
              broadcastToRoom(clientInfo.roomId, {
                type: 'message_pinned',
                messageId,
                is_pinned: newState
              });
            }
          } finally {
            connection.release();
          }
        }
        
        // Печатает
        if (message.type === 'typing') {
          const clientInfo = clients.get(ws);
          if (clientInfo) {
            broadcastToRoom(clientInfo.roomId, {
              type: 'typing',
              roomId: clientInfo.roomId,
              userId: clientInfo.userId,
              isTyping: message.isTyping,
              userName: clientInfo.userName
            }, ws);
          }
        }
        
        // Отметка о прочтении
        if (message.type === 'mark_read') {
          const { messageId } = message;
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;
          
          const connection = await pool.getConnection();
          try {
            await connection.execute(
              'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)',
              [messageId, clientInfo.userId]
            );
            
            const [countResult] = await connection.execute(
              'SELECT COUNT(*) as read_count FROM message_reads WHERE message_id = ?',
              [messageId]
            );
            
            broadcastToRoom(clientInfo.roomId, {
              type: 'message_read',
              messageId,
              read_count: countResult[0].read_count
            });
          } finally {
            connection.release();
          }
        }
        
      } catch (error) {
        console.error('❌ Error processing message:', error);
      }
    });

    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      
      if (clientInfo) {
        const { roomId, userId } = clientInfo;
        
        if (rooms.has(roomId)) {
          rooms.get(roomId).delete(userId);
          if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
          }
        }
        
        clients.delete(ws);
        console.log(`👋 User ${userId} disconnected from room ${roomId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  function broadcastToRoom(roomId, message, excludeWs = null) {
    if (rooms.has(roomId)) {
      const messageStr = JSON.stringify(message);
      rooms.get(roomId).forEach((clientWs) => {
        if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(messageStr);
        }
      });
    }
  }

  console.log('🔌 WebSocket server initialized');
  return wss;
}

module.exports = setupWebSocket;