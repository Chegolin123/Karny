// C:\OSPanel\domains\karny\backend\src\routes\events\index.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const createRouter = require('./create');
const updateRouter = require('./update');
const deleteRouter = require('./delete');
const attendeesRouter = require('./attendees');
const remindRouter = require('./remind');
const attendRouter = require('./attend');
const statusRouter = require('./status');
const timeOptionsRouter = require('./timeOptions');
const votesRouter = require('./votes');

// Подключаем маршруты
router.use('/', createRouter);
router.use('/', updateRouter);
router.use('/', deleteRouter);
router.use('/', attendeesRouter);
router.use('/', remindRouter);
router.use('/', attendRouter);
router.use('/', statusRouter);
router.use('/:eventId', timeOptionsRouter);
router.use('/:eventId', votesRouter);

module.exports = router;
// Добавляем маршрут для запуска сеанса
const startSessionRouter = require('./start-session');
router.use('/', startSessionRouter);
const restartRouter = require('./restart-session'); router.use('/', restartRouter);
