// C:\OSPanel\domains\karny\backend\src\db.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Создаём пул подключений
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'karny_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Проверка подключения
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL подключен успешно');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };