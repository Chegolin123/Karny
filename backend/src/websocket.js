// C:\OSPanel\domains\karny\backend\src\websocket.js

const WebSocket = require('ws');
const { pool } = require('./db');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // Хранилище активных соединений: roomId -> Map(userId -> WebSocket)
  const rooms = new Map();
  
  // Хранилище информации о пользователях: ws -> { userId, roomId, userName, userData }
  const clients = new Map();

  wss.on('connection', async (ws, req) => {
    // Используем WHATWG URL API вместо url.parse()
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('roomId');
    const userId = url.searchParams.get('userId');

    if (!roomId || !userId) {
      ws.close(1008, 'Missing roomId or userId');
      return;
    }

    // Проверяем, что пользователь является участником комнаты
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

        // Получаем информацию о пользователе
        const [users] = await connection.execute(
          'SELECT id, first_name, last_name, username, photo_url FROM users WHERE id = ?',
          [userId]
        );
        
        const user = users[0];
        
        // Добавляем в комнату
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }
        rooms.get(roomId).set(userId, ws);
        
        // Сохраняем информацию о клиенте
        clients.set(ws, {
          userId,
          roomId,
          userName: `${user.first_name} ${user.last_name || ''}`.trim(),
          userData: user
        });

        console.log(`✅ User ${userId} (${user.first_name}) connected to room ${roomId}`);

        // Отправляем системное сообщение о входе
        const joinMessage = {
          type: 'system',
          roomId,
          content: `${user.first_name} присоединился к чату`,
          timestamp: new Date().toISOString()
        };
        
        broadcastToRoom(roomId, joinMessage, ws);

        // Отправляем последние 50 сообщений из БД
        const [messages] = await connection.execute(
          'SELECT * FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 50',
          [roomId]
        );

        if (messages.length > 0) {
          // Получаем информацию о пользователях для всех сообщений
          const userIds = [...new Set(messages.map(m => m.user_id))];
          const placeholders = userIds.map(() => '?').join(',');
          
          if (userIds.length > 0) {
            const [messageUsers] = await connection.execute(
              `SELECT id, first_name, last_name, username, photo_url FROM users WHERE id IN (${placeholders})`,
              userIds
            );
            
            const usersMap = {};
            messageUsers.forEach(u => { usersMap[u.id] = u; });
            
            // Отправляем сообщения в обратном порядке (старые сначала)
            messages.reverse().forEach(msg => {
              ws.send(JSON.stringify({
                type: 'message',
                id: msg.id,
                roomId: msg.room_id,
                userId: msg.user_id,
                content: msg.content,
                timestamp: msg.created_at,
                user: usersMap[msg.user_id] || null
              }));
            });
          } else {
            // Если нет пользователей (не должно случиться), отправляем без user
            messages.reverse().forEach(msg => {
              ws.send(JSON.stringify({
                type: 'message',
                id: msg.id,
                roomId: msg.room_id,
                userId: msg.user_id,
                content: msg.content,
                timestamp: msg.created_at,
                user: null
              }));
            });
          }
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

        if (message.type === 'message') {
          const { content } = message;
          
          if (!content || content.trim().length === 0) return;
          if (content.length > 2000) return; // Ограничение длины

          // Сохраняем сообщение в БД
          const connection = await pool.getConnection();
          try {
            const [result] = await connection.execute(
              'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
              [clientInfo.roomId, clientInfo.userId, content.trim()]
            );
            
            const messageId = result.insertId;
            
            // Получаем полную информацию о сообщении
            const [messages] = await connection.execute(
              'SELECT * FROM messages WHERE id = ?',
              [messageId]
            );
            
            const savedMessage = messages[0];
            
            // Получаем данные пользователя
            const [users] = await connection.execute(
              'SELECT id, first_name, last_name, username, photo_url FROM users WHERE id = ?',
              [clientInfo.userId]
            );
            
            const messageData = {
              type: 'message',
              id: savedMessage.id,
              roomId: clientInfo.roomId,
              userId: clientInfo.userId,
              content: savedMessage.content,
              timestamp: savedMessage.created_at,
              user: users[0] || null
            };
            
            // Рассылаем всем в комнате
            broadcastToRoom(clientInfo.roomId, messageData);
            
          } finally {
            connection.release();
          }
        }
        
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
        
      } catch (error) {
        console.error('❌ Error processing message:', error);
      }
    });

    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      
      if (clientInfo) {
        const { roomId, userId, userName } = clientInfo;
        
        // Удаляем из комнаты
        if (rooms.has(roomId)) {
          rooms.get(roomId).delete(userId);
          if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
          }
        }
        
        // Отправляем системное сообщение о выходе
        const leaveMessage = {
          type: 'system',
          roomId,
          content: `${userName} покинул чат`,
          timestamp: new Date().toISOString()
        };
        
        broadcastToRoom(roomId, leaveMessage);
        
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
      rooms.get(roomId).forEach((clientWs, userId) => {
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