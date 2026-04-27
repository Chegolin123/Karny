// /var/www/karny/frontend/src/components/room/chat/chatUtils.js

/**
 * Типы сообщений
 */
export const MessageType = {
  TEXT: 'message',
  SYSTEM: 'system',
  POLL: 'poll'
};

/**
 * Создание чистого сообщения из сырых данных
 * Все поля проходят строгую валидацию
 */
export function createMessage(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id || null;
  const tempId = raw.tempId || null;

  // Контент: берем raw.content, чистим, если пустой — пустая строка
  let content = '';
  if (raw.content !== null && raw.content !== undefined) {
    content = String(raw.content).trim();
  }
  // Отсекаем мусорные значения
  if (content === '0' || content === 'null' || content === 'undefined' || content === 'NaN') {
    content = '';
  }

  return {
    id,
    tempId,
    type: Object.values(MessageType).includes(raw.type) ? raw.type : MessageType.TEXT,
    content,
    userId: String(raw.userId || raw.user_id || ''),
    user_id: String(raw.user_id || raw.userId || ''),
    timestamp: raw.created_at || raw.timestamp || raw.createdAt || new Date().toISOString(),
    is_edited: Boolean(raw.is_edited),
    is_pinned: Boolean(raw.is_pinned),
    edited_at: raw.edited_at || null,
    reply_to_id: raw.reply_to_id || null,
    reply_to_content: raw.reply_to_content || '',
    reply_to_first_name: raw.reply_to_first_name || '',
    read_count: parseInt(raw.read_count, 10) || 0,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    user: raw.user ? {
      id: raw.user.id || raw.userId || raw.user_id || '',
      first_name: raw.user.first_name || 'Неизвестный',
      last_name: raw.user.last_name || '',
      username: raw.user.username || '',
      photo_url: raw.user.photo_url || ''
    } : null,
    // Опрос
    poll: raw.poll || null
  };
}

/**
 * Проверка, можно ли отобразить сообщение
 */
export function isRenderable(msg) {
  if (!msg) return false;
  const hasContent = msg.content && msg.content.trim().length > 0;
  const hasAttachments = msg.attachments && msg.attachments.length > 0;
  const hasPoll = !!msg.poll;
  return hasContent || hasAttachments || hasPoll;
}

/**
 * Сортировка сообщений
 */
export function sortMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return [...messages].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    const aTime = new Date(a.timestamp || 0).getTime();
    const bTime = new Date(b.timestamp || 0).getTime();
    return aTime - bTime;
  });
}

/**
 * Генерация уникального временного идентификатора
 */
let counter = 0;
export function generateTempId() {
  counter++;
  return `temp_${Date.now()}_${counter}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Безопасное форматирование времени
 */
export function formatMessageTime(timestamp) {
  if (!timestamp || timestamp === '0' || timestamp === 0) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Поиск индекса сообщения в массиве
 */
export function findMessageIndex(messages, id) {
  return messages.findIndex(m => (m.id && m.id === id) || (m.tempId && m.tempId === id));
}

/**
 * Проверка на дубликат в массиве
 */
export function hasMessage(messages, id) {
  if (!id) return false;
  return messages.some(m => (m.id && m.id === id) || (m.tempId && m.tempId === id));
}