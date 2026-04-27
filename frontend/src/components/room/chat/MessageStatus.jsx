import { useEffect, useState } from 'react';

// Время между отправкой и автоматическим "прочтением" (если чат в фокусе)
const AUTO_READ_DELAY = 2000;

export default function MessageStatus({ message, isOwn, isChatFocused, onMarkAsRead }) {
  const [status, setStatus] = useState('sent');

  useEffect(() => {
    // Определяем текущий статус
    if (message.tempId) {
      setStatus('sending');
    } else if (message.read_count > 0) {
      setStatus('read');
    } else {
      setStatus('sent');
    }
  }, [message.tempId, message.read_count]);

  // Авто-прочтение: если сообщение "sent", чат в фокусе, и прошло 2 секунды
  useEffect(() => {
    if (status === 'sent' && isChatFocused && message.id && !message.tempId) {
      const timer = setTimeout(() => {
        onMarkAsRead?.(message.id);
      }, AUTO_READ_DELAY);
      return () => clearTimeout(timer);
    }
  }, [status, isChatFocused, message.id, message.tempId, onMarkAsRead]);

  if (!isOwn) return null;

  switch (status) {
    // Отправка
    case 'sending':
      return (
        <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        </svg>
      );

    // Прочитано
    case 'read':
      return (
        <span className="text-[#3b82f6] flex items-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <svg className="w-4 h-4 -ml-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        </span>
      );

    // Отправлено (по умолчанию)
    default:
      return (
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      );
  }
}
