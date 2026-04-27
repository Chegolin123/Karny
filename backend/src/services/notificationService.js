// C:\OSPanel\domains\karny\backend\src\services\notificationService.js

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;

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
  
  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          
          if (json.ok) {
            console.log(`✅ Сообщение отправлено пользователю ${chatId}`);
            resolve(true);
          } else {
            console.error('❌ Ошибка отправки сообщения:', json.description);
            
            if (json.description?.includes('bot can\'t initiate conversation')) {
              console.warn(`⚠️ Пользователь ${chatId} не запускал бота`);
            }
            
            resolve(false);
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга ответа:', e);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Ошибка запроса к Telegram API:', error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Уведомить участников комнаты о новом событии или напомнить
 */
async function notifyRoomMembers(roomId, event, excludeUserId = null, type = 'new_event') {
  const { pool } = require('../db');
  
  try {
    const connection = await pool.getConnection();
    
    try {
      const [rooms] = await connection.execute(
        `SELECT r.name, r.code 
         FROM rooms r 
         WHERE r.id = ?`,
        [roomId]
      );
      
      if (rooms.length === 0) {
        console.error('❌ Комната не найдена');
        return { sentCount: 0, totalMembers: 0 };
      }
      
      const room = rooms[0];
      
      let query = `
        SELECT u.id, u.first_name, u.chat_id, u.notifications_enabled
        FROM room_members rm
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = ?
      `;
      
      const params = [roomId];
      
      if (excludeUserId) {
        query += ' AND u.id != ?';
        params.push(excludeUserId);
      }
      
      const [members] = await connection.execute(query, params);
      
      const actionText = type === 'reminder' ? 'отправки напоминаний' : 'отправки уведомлений';
      console.log(`📨 Начало ${actionText} ${members.length} участникам комнаты "${room.name}"`);
      
      let message;
      if (type === 'reminder') {
        message = formatReminderMessage(room, event);
      } else {
        message = formatEventNotification(room, event);
      }
      
      let sentCount = 0;
      
      for (const member of members) {
        if (member.chat_id && member.notifications_enabled !== false) {
          const success = await sendTelegramMessage(member.chat_id, message);
          if (success) sentCount++;
          
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          console.warn(`⚠️ Пользователь ${member.id} (${member.first_name}) не имеет chat_id`);
        }
      }
      
      console.log(`✅ Завершено: ${sentCount}/${members.length}`);
      
      return { sentCount, totalMembers: members.length };
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error);
    return { sentCount: 0, totalMembers: 0 };
  }
}

/**
 * Отправить напоминание о событии
 */
async function sendEventReminder(roomId, event, excludeUserId = null) {
  return notifyRoomMembers(roomId, event, excludeUserId, 'reminder');
}

/**
 * Форматирование сообщения о новом событии
 */
function formatEventNotification(room, event) {
  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let message = `🎉 <b>Новое событие в комнате «${room.name}»!</b>\n\n`;
  message += `<b>${event.name}</b>\n`;
  
  if (event.description) {
    message += `${event.description}\n`;
  }
  
  message += `\n📅 ${dateStr}\n`;
  message += `👥 Уже идут: ${event.going_count || 0}\n\n`;
  message += `<i>Откройте Karny чтобы отметить участие!</i>`;
  
  return message;
}

/**
 * Форматирование сообщения-напоминания
 */
function formatReminderMessage(room, event) {
  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let message = `🔔 <b>Напоминание о событии в комнате «${room.name}»!</b>\n\n`;
  message += `<b>${event.name}</b>\n`;
  
  if (event.description) {
    message += `${event.description}\n`;
  }
  
  message += `\n📅 ${dateStr}\n`;
  message += `👥 Идут: ${event.going_count || 0}\n\n`;
  message += `<i>Не забудьте о встрече!</i>`;
  
  return message;
}

module.exports = {
  sendTelegramMessage,
  notifyRoomMembers,
  sendEventReminder
};