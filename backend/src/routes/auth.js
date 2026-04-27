const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTelegramData, isDevMode } = require('../utils/telegramAuth');

router.post('/', async (req, res) => {
  try {
    // Проверяем, это WebHook от Telegram? (любой запрос от Telegram API)
    if (req.body.update_id || req.body.message || req.body.callback_query || 
        req.body.channel_post || req.body.edited_message || req.body.my_chat_member) {
      console.log('📨 Получен WebHook от Telegram, update_id:', req.body.update_id);
      return res.json({ ok: true });
    }
    
    const { initData, devMode, userId } = req.body;
    
    if (devMode && userId) {
      console.log('⚠️ Dev mode: авторизация без проверки подписи');
      
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );
        
        if (users.length === 0) {
          return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json({ success: true, user: users[0], devMode: true });
      } finally {
        connection.release();
      }
      return;
    }
    
    if (!initData) {
      // 🆕 Логируем тело запроса для диагностики
      console.log('❌ initData не передан. Тело запроса:', JSON.stringify(req.body).substring(0, 200));
      return res.status(400).json({ error: 'initData обязателен' });
    }
    
    console.log('\n🚀 ЗАПРОС АВТОРИЗАЦИИ ЧЕРЕЗ TELEGRAM');
    
    const userData = validateTelegramData(initData);
    
    if (!userData) {
      console.error('❌ Авторизация отклонена: невалидные данные');
      return res.status(401).json({ error: 'Невалидные данные Telegram' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        `INSERT INTO users (id, username, first_name, last_name, photo_url, chat_id, last_login) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           username = VALUES(username),
           first_name = VALUES(first_name),
           last_name = VALUES(last_name),
           photo_url = VALUES(photo_url),
           chat_id = COALESCE(chat_id, VALUES(chat_id)),
           last_login = NOW()`,
        [userData.id, userData.username, userData.firstName, userData.lastName, userData.photoUrl, userData.id]
      );
      
      const [users] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [userData.id]
      );
      
      console.log('✅ Авторизация успешна, пользователь:', userData.id);
      
      res.json({ success: true, user: users[0] });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId обязателен' });
    
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
      res.json({ user: users[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
