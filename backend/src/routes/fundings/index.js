const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../../db');

// POST /api/rooms/:roomId/fundings — создать сбор
router.post('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { title, description, goal, eventId, pollId, userId } = req.body;
    
    if (!title || !goal || goal <= 0) return res.status(400).json({ error: 'Название и цель обязательны' });
    
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'INSERT INTO fundings (room_id, title, description, goal, event_id, poll_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [roomId, title, description || null, goal, eventId || null, pollId || null, userId]
      );
      
      const [fundings] = await conn.execute(
        'SELECT f.*, u.first_name, u.last_name FROM fundings f JOIN users u ON f.created_by = u.id WHERE f.id = ?',
        [result.insertId]
      );
      
      res.json({ success: true, funding: fundings[0] });
    } finally { conn.release(); }
  } catch (err) {
    console.error('Ошибка создания сбора:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:roomId/fundings — список сборов
router.get('/', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const conn = await pool.getConnection();
    try {
      const [fundings] = await conn.execute(
        'SELECT f.*, u.first_name, u.last_name FROM fundings f JOIN users u ON f.created_by = u.id WHERE f.room_id = ? ORDER BY f.created_at DESC',
        [roomId]
      );

      // Для каждого сбора получаем взносы
      for (const f of fundings) {
        const [contributions] = await conn.execute(
          'SELECT fc.*, u.first_name, u.last_name FROM funding_contributions fc JOIN users u ON fc.user_id = u.id WHERE fc.funding_id = ? ORDER BY fc.created_at DESC',
          [f.id]
        );
        f.contributions = contributions;
      }
      
      res.json({ fundings });
    } finally { conn.release(); }
  } catch (err) {
    console.error('Ошибка загрузки сборов:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:roomId/fundings/:id/contribute — добавить взнос
router.post('/:id/contribute', async (req, res) => {
  try {
    const { roomId, id } = req.params;
    const { amount, note, userId } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Сумма обязательна' });
    
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      await conn.execute(
        'INSERT INTO funding_contributions (funding_id, user_id, amount, note) VALUES (?, ?, ?, ?)',
        [id, userId, amount, note || null]
      );
      
      await conn.execute(
        'UPDATE fundings SET collected = (SELECT SUM(amount) FROM funding_contributions WHERE funding_id = ?) WHERE id = ?',
        [id, id]
      );
      
      await conn.commit();
      
      const [fundings] = await conn.execute(
        'SELECT f.*, u.first_name, u.last_name FROM fundings f JOIN users u ON f.created_by = u.id WHERE f.id = ?',
        [id]
      );
      
      const [contributions] = await conn.execute(
        'SELECT fc.*, u.first_name, u.last_name FROM funding_contributions fc JOIN users u ON fc.user_id = u.id WHERE fc.funding_id = ? ORDER BY fc.created_at DESC',
        [id]
      );
      
      res.json({ success: true, funding: fundings[0], contributions });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally { conn.release(); }
  } catch (err) {
    console.error('Ошибка взноса:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:roomId/fundings/:id/close — закрыть сбор
router.post('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    try {
      await conn.execute('UPDATE fundings SET is_closed = 1 WHERE id = ?', [id]);
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) {
    console.error('Ошибка закрытия сбора:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
