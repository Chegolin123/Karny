-- C:\OSPanel\domains\karny\backend\migrations\add_notification_tracking.sql

USE karny_db;

-- Добавляем поля для отслеживания уведомлений
ALTER TABLE room_members 
ADD COLUMN last_chat_notification_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Время последнего уведомления о чате',
ADD COLUMN unread_since_notification INT DEFAULT 0 COMMENT 'Счётчик сообщений с последнего уведомления';

-- Сбрасываем существующие значения
UPDATE room_members SET last_chat_notification_at = NULL, unread_since_notification = 0;