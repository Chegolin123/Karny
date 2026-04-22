// C:\OSPanel\domains\karny\backend\src\services\chatNotificationService.js

const { pool } = require('../db');
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const NOTIFICATION_COOLDOWN_MINUTES = 5;
const MIN_MESSAGES_FOR_COUNT = 10;

/**
 * Отправить сообщение пользователю через бота
 */
async function sendTelegramMessage(chatId, text, options = {}) {
  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не установлен');
    return false;
  }
  
  if (!chatId) {
    console.error('❌ chatId не указан');
    return false;
  }
  
  const message = {
    chat_id: chatId,
    text: text,
    parse_mode: options.parseMode || 'HTML',
    disable_web_page_preview: options.disableWebPagePreview || true,
    disable_notification: options.disableNotification || false
  };
  
  const data = JSON.stringify(message);
  
  const requestOptions = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  return new Promise((resolve) => {
    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          
          if (json.ok) {
            console.log(`✅ Сообщение отправлено пользователю ${chatId}: "${text}"`);
            resolve(true);
          } else {
            console.error('❌ Ошибка отправки сообщения:', json.description);
            resolve(false);
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга ответа:', e);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Ошибка запроса к Telegram API:', error);
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Отправить уведомление о новых сообщениях в Telegram
 */
async function sendChatNotification(chatId, roomName, messageCount = 1) {
  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не установлен');
    return false;
  }
  
  if (!chatId) {
    console.error('❌ chatId не указан');
    return false;
  }
  
  let text;
  if (messageCount === 1) {
    text = `💬 В чате «${roomName}» началось обсуждение`;
  } else {
    text = `💬 В чате «${roomName}» ${messageCount} новых сообщений`;
  }
  
  return await sendTelegramMessage(chatId, text);
}

/**
 * Проверить, нужно ли отправить уведомление пользователю
 */
async function shouldNotifyUser(roomId, userId) {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(
      `SELECT last_chat_notification_at, unread_since_notification, chat_notifications_enabled
       FROM room_members 
       WHERE room_id = ? AND user_id = ?`,
      [roomId, userId]
    );
    
    if (rows.length === 0) return { shouldNotify: false };
    
    const member = rows[0];
    
    if (!member.chat_notifications_enabled) {
      return { shouldNotify: false };
    }
    
    if (!member.last_chat_notification_at) {
      return { 
        shouldNotify: true, 
        messageCount: 1,
        isFirst: true 
      };
    }
    
    const lastNotification = new Date(member.last_chat_notification_at);
    const now = new Date();
    const minutesPassed = (now - lastNotification) / (1000 * 60);
    
    const unreadCount = (member.unread_since_notification || 0) + 1;
    
    const timeCondition = minutesPassed >= NOTIFICATION_COOLDOWN_MINUTES;
    const countCondition = unreadCount >= MIN_MESSAGES_FOR_COUNT;
    
    if (timeCondition || countCondition) {
      return {
        shouldNotify: true,
        messageCount: unreadCount,
        isFirst: false
      };
    }
    
    return { shouldNotify: false };
    
  } finally {
    connection.release();
  }
}

/**
 * Обновить счётчики после отправки уведомления
 */
async function updateNotificationCounters(roomId, userId, reset = true) {
  const connection = await pool.getConnection();
  
  try {
    if (reset) {
      await connection.execute(
        `UPDATE room_members 
         SET last_chat_notification_at = NOW(), unread_since_notification = 0 
         WHERE room_id = ? AND user_id = ?`,
        [roomId, userId]
      );
    } else {
      await connection.execute(
        `UPDATE room_members 
         SET unread_since_notification = unread_since_notification + 1 
         WHERE room_id = ? AND user_id = ?`,
        [roomId, userId]
      );
    }
  } finally {
    connection.release();
  }
}

/**
 * Уведомить офлайн-участников о новом сообщении (гибридный алгоритм)
 */
async function notifyOfflineMembers(roomId, senderId, senderName) {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        'SELECT id, name FROM rooms WHERE id = ?',
        [roomId]
      );
      
      if (rooms.length === 0) return;
      
      const room = rooms[0];
      
      const [members] = await connection.execute(
        `SELECT u.id, u.chat_id, rm.last_chat_notification_at, rm.unread_since_notification
         FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = ?
           AND u.id != ?
           AND u.chat_id IS NOT NULL
           AND rm.chat_notifications_enabled = TRUE
           AND (rm.last_seen_in_chat IS NULL 
                OR rm.last_seen_in_chat < DATE_SUB(NOW(), INTERVAL 30 SECOND))`,
        [roomId, senderId]
      );
      
      if (members.length === 0) return;
      
      console.log(`📨 Проверка уведомлений для ${members.length} офлайн-участников комнаты "${room.name}"`);
      
      let sentCount = 0;
      let skippedCount = 0;
      
      for (const member of members) {
        const { shouldNotify, messageCount } = await shouldNotifyUser(roomId, member.id);
        
        if (shouldNotify) {
          const success = await sendChatNotification(member.chat_id, room.name, messageCount);
          
          if (success) {
            sentCount++;
            await updateNotificationCounters(roomId, member.id, true);
          }
        } else {
          skippedCount++;
          await updateNotificationCounters(roomId, member.id, false);
        }
        
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      console.log(`✅ Уведомления о чате: отправлено ${sentCount}, пропущено ${skippedCount}`);
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений о чате:', error);
  }
}

/**
 * Обновить время последней активности в чате
 */
async function updateLastSeen(roomId, userId) {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE room_members SET last_seen_in_chat = NOW() WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Ошибка обновления last_seen:', error);
  }
}

/**
 * Сбросить счётчики уведомлений при входе в чат
 */
async function resetNotificationCounters(roomId, userId) {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        `UPDATE room_members 
         SET last_chat_notification_at = NULL, unread_since_notification = 0 
         WHERE room_id = ? AND user_id = ?`,
        [roomId, userId]
      );
      
      console.log(`🔄 Счётчики уведомлений сброшены для пользователя ${userId} в комнате ${roomId}`);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Ошибка сброса счётчиков:', error);
  }
}

/**
 * Переключить уведомления чата для пользователя
 */
async function toggleChatNotifications(roomId, userId, enabled) {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE room_members SET chat_notifications_enabled = ? WHERE room_id = ? AND user_id = ?',
        [enabled, roomId, userId]
      );
      
      return true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Ошибка переключения уведомлений:', error);
    return false;
  }
}

/**
 * Отправить уведомление о входе пользователя в чат
 */
async function sendJoinNotification(chatId, roomName, userName) {
  if (!chatId) return false;
  const text = `👋 ${userName} присоединился к чату «${roomName}»`;
  return await sendTelegramMessage(chatId, text);
}

/**
 * Отправить уведомление о выходе пользователя из чата
 */
async function sendLeaveNotification(chatId, roomName, userName) {
  if (!chatId) return false;
  const text = `👋 ${userName} покинул чат «${roomName}»`;
  return await sendTelegramMessage(chatId, text);
}

module.exports = {
  sendTelegramMessage,
  sendChatNotification,
  notifyOfflineMembers,
  updateLastSeen,
  resetNotificationCounters,
  toggleChatNotifications,
  sendJoinNotification,
  sendLeaveNotification
};