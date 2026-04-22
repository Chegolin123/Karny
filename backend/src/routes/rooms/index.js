// C:\OSPanel\domains\karny\backend\src\routes\rooms\index.js

const express = require('express');
const router = express.Router();

// Импорт всех подмаршрутов
const listRouter = require('./list');
const createRouter = require('./create');
const getRouter = require('./get');
const updateRouter = require('./update');
const deleteRouter = require('./delete');
const joinRouter = require('./join');
const leaveRouter = require('./leave');
const transferRouter = require('./transfer');

// ВАЖНО: порядок имеет значение!
// POST /api/rooms/join должен быть ПЕРЕД /:id маршрутами

// 1. Присоединение по коду
router.use('/join', joinRouter);

// 2. Выход из комнаты
router.use('/', leaveRouter);

// 3. Передача прав
router.use('/', transferRouter);

// 4. Получение списка
router.use('/', listRouter);

// 5. Создание комнаты
router.use('/', createRouter);

// 6. Получение, обновление, удаление конкретной комнаты
router.use('/', getRouter);
router.use('/', updateRouter);
router.use('/', deleteRouter);

// Отладка
console.log('📦 rooms/index.js loaded');
console.log('📦 Routes:');
router.stack.forEach(layer => {
  if (layer.name === 'router') {
    const path = layer.regexp.toString().match(/\/\^\\\/(.*?)\\\//)?.[1] || 'unknown';
    console.log(`  [sub-router] ${path}`);
  } else if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    console.log(`  ${methods} ${layer.route.path}`);
  }
});

module.exports = router;