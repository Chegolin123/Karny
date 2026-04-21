// C:\OSPanel\domains\karny\frontend\src\api.js

const API_BASE = '/api';

function isTelegramWebApp() {
  const hostname = window.location.hostname;
  if (hostname.includes('serveo') || hostname.includes('serveousercontent')) {
    console.log('✅ Определён Telegram по hostname:', hostname);
    return true;
  }
  
  if (window.Telegram?.WebApp) {
    console.log('✅ Telegram WebApp API обнаружен');
    return true;
  }
  
  return false;
}

const DEV_MODE = !isTelegramWebApp();
const DEV_USER_ID = 1;

console.log('🔧 Режим:', DEV_MODE ? 'DEVELOPMENT' : 'TELEGRAM');
console.log('📍 Hostname:', window.location.hostname);
console.log('📍 Telegram API:', !!window.Telegram?.WebApp);

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}

export function getCurrentUserId() {
  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user.id;
  }
  return DEV_USER_ID;
}

export async function auth() {
  const tg = window.Telegram?.WebApp;
  
  console.log('🔐 auth(): Telegram API:', !!tg);
  
  if (tg && tg.initData) {
    console.log('🔐 Используем реальную авторизацию Telegram');
    return fetchAPI('/auth', {
      method: 'POST',
      body: JSON.stringify({ initData: tg.initData }),
    });
  }
  
  console.log('⚠️ Используем dev-авторизацию');
  return fetchAPI('/auth', {
    method: 'POST',
    body: JSON.stringify({ devMode: true, userId: DEV_USER_ID }),
  });
}

export async function getRooms() {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms?userId=${userId}`);
}

export async function createRoom(name) {
  const userId = getCurrentUserId();
  
  return fetchAPI('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, userId }),
  });
}

export async function getRoom(roomId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}?userId=${userId}`);
}

export async function updateRoom(roomId, name) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, userId }),
  });
}

export async function joinRoom(code) {
  const userId = getCurrentUserId();
  
  return fetchAPI('/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ code, userId }),
  });
}

export async function leaveRoom(roomId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/leave`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function deleteRoom(roomId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  });
}

export async function createEvent(roomId, name, eventDate, description = '') {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events`, {
    method: 'POST',
    body: JSON.stringify({ name, description, eventDate, userId }),
  });
}

export async function updateEvent(roomId, eventId, name, eventDate, description = '') {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description, eventDate, userId }),
  });
}

export async function attendEvent(roomId, eventId, status = 'going') {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/attend`, {
    method: 'POST',
    body: JSON.stringify({ status, userId }),
  });
}

export async function deleteEvent(roomId, eventId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events/${eventId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  });
}

export async function getAttendeeStatus(roomId, eventId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/status?userId=${userId}`);
}

export async function getEventAttendees(roomId, eventId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/attendees?userId=${userId}`);
}

export async function sendReminder(roomId, eventId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/remind`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function getMessages(roomId, limit = 50, before = null) {
  const userId = getCurrentUserId();
  
  let url = `/rooms/${roomId}/messages?userId=${userId}&limit=${limit}`;
  if (before) {
    url += `&before=${before}`;
  }
  
  return fetchAPI(url);
}