const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/var/www/karny/backend/.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'karny_user',
  password: process.env.DB_PASSWORD || '730639779',
  database: process.env.DB_NAME || 'karny_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MariaDB connected on port', pool.pool.config.connectionConfig.port);
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };
