// C:\OSPanel\domains\karny\backend\src\utils\telegramAuth.js

const crypto = require('crypto');

function validateTelegramData(initData) {
  try {
    const botToken = process.env.BOT_TOKEN;
    
    console.log('\n========================================');
    console.log('🔍 ВАЛИДАЦИЯ TELEGRAM ДАННЫХ (ПРАВИЛЬНЫЙ АЛГОРИТМ)');
    console.log('========================================');
    
    if (!botToken) {
      console.error('❌ BOT_TOKEN не установлен');
      return null;
    }
    
    console.log('📝 BOT_TOKEN:', botToken.substring(0, 15) + '...');
    
    // Парсим URL-encoded строку
    const urlParams = new URLSearchParams(initData);
    const data = {};
    
    for (const [key, value] of urlParams.entries()) {
      data[key] = value;
    }
    
    console.log('📦 ВСЕ КЛЮЧИ:', Object.keys(data).join(', '));
    
    // Извлекаем hash
    const hash = data.hash;
    delete data.hash;
    
    console.log('🔐 Hash из запроса:', hash);
    
    // ВАЖНО: Убираем лишние поля, которые могли добавиться
    // Оставляем ТОЛЬКО те, что участвуют в подписи
    const allowedKeys = ['auth_date', 'query_id', 'signature', 'user'];
    
    // Сортируем ключи строго по алфавиту
    const sortedKeys = Object.keys(data)
      .filter(key => allowedKeys.includes(key))
      .sort();
    
    console.log('📋 Ключи для проверки:', sortedKeys.join(', '));
    
    // Создаём строку проверки
    const checkString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('\n');
    
    console.log('📋 Check string (полностью):');
    console.log(checkString);
    console.log('📋 Длина checkString:', checkString.length);
    
    // Создаём секретный ключ из bot_token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');
    
    console.log('\n✅ Вычисленный hash:', calculatedHash);
    console.log('❓ Полученный hash: ', hash);
    console.log('🎯 Совпадение:      ', calculatedHash === hash ? '✅ ДА' : '❌ НЕТ');
    
    if (calculatedHash !== hash) {
      console.error('\n❌ ИТОГ: Хеш не совпадает');
      console.log('========================================\n');
      return null;
    }
    
    // Проверяем срок действия
    const authDate = parseInt(data.auth_date);
    const now = Math.floor(Date.now() / 1000);
    const age = now - authDate;
    
    console.log('\n⏰ ПРОВЕРКА ВРЕМЕНИ:');
    console.log('auth_date:', authDate);
    console.log('now:       ', now);
    console.log('Возраст:   ', age, 'секунд');
    
    if (age > 86400) {
      console.error('❌ Данные устарели');
      console.log('========================================\n');
      return null;
    }
    
    // Парсим данные пользователя
    const user = JSON.parse(data.user);
    
    console.log('\n👤 ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:');
    console.log('ID:', user.id);
    console.log('Имя:', user.first_name, user.last_name || '');
    console.log('Username:', user.username || 'нет');
    
    console.log('\n✅ ИТОГ: Валидация успешна');
    console.log('========================================\n');
    
    return {
      id: user.id,
      username: user.username || null,
      firstName: user.first_name,
      lastName: user.last_name || null,
      photoUrl: user.photo_url || null,
      authDate: data.auth_date,
      hash: hash
    };
    
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    console.log('========================================\n');
    return null;
  }
}

function generateRoomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function isDevMode() {
  return process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true';
}

module.exports = { validateTelegramData, generateRoomCode, isDevMode };