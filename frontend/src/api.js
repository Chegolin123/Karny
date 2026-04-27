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
const DEV_USER_ID = parseInt(localStorage.getItem("dev_user_id")) || 743554312;

console.log('🔧 Режим:', DEV_MODE ? 'DEVELOPMENT' : 'TELEGRAM');
console.log('📍 Hostname:', window.location.hostname);
console.log('📍 Telegram API:', !!window.Telegram?.WebApp);

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data === null || data === undefined) {
      throw new Error('Пустой ответ от сервера');
    }
    
    return data;
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error);
    throw error;
  }
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
  return fetchAPI(`/rooms?type=my&userId=${userId}`);
}

export async function getPublicRooms() {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms?type=public&userId=${userId}`);
}

export async function createRoom(name, isPrivate = false, password = null) {
  const userId = getCurrentUserId();
  
  return fetchAPI('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, isPrivate, password, userId }),
  });
}

export async function getRoom(roomId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}?userId=${userId}`);
}

export async function updateRoom(roomId, name, photoUrl = null) {
  const userId = getCurrentUserId();
  
  const body = { userId };
  if (name !== undefined) body.name = name;
  if (photoUrl !== undefined) body.photo_url = photoUrl;
  
  return fetchAPI(`/rooms/${roomId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function joinRoom(code, password = null) {
  const userId = getCurrentUserId();
  
  return fetchAPI('/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ code, password, userId }),
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

export async function transferRoomOwnership(roomId, newOwnerId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ userId, newOwnerId }),
  });
}

export async function createEvent(roomId, name, eventDate, description = '', timeVotingEnabled = false, videoUrl = null) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events`, {
    method: 'POST',
    body: JSON.stringify({ 
      name, 
      description: description || '', 
      eventDate: eventDate || null, 
      timeVotingEnabled: timeVotingEnabled === true,
      videoUrl: videoUrl || null,
      userId 
    }),
  });
}

export async function updateEvent(roomId, eventId, name, eventDate, description = '', timeVotingEnabled = false) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify({ 
      name, 
      description: description || '', 
      eventDate: eventDate || null, 
      timeVotingEnabled: timeVotingEnabled === true,
      userId 
    }),
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

export async function editMessage(roomId, messageId, content) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content, userId }),
  });
}

export async function deleteMessage(roomId, messageId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/messages/${messageId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  });
}

export async function pinMessage(roomId, messageId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/messages/${messageId}/pin`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function getChatNotificationSettings(roomId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/chat/notifications?userId=${userId}`);
}

export async function setChatNotificationSettings(roomId, enabled) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/chat/notifications`, {
    method: 'POST',
    body: JSON.stringify({ userId, enabled }),
  });
}

export async function getTimeOptions(roomId, eventId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/time-options?userId=${userId}`);
}

export async function addTimeOption(roomId, eventId, proposedDate) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/time-options`, {
    method: 'POST',
    body: JSON.stringify({ proposedDate, userId }),
  });
}

export async function deleteTimeOption(roomId, eventId, optionId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/time-options/${optionId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  });
}

export async function voteForTime(roomId, eventId, optionId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId, userId }),
  });
}

export async function selectWinningTime(roomId, eventId, optionId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/select-time`, {
    method: 'POST',
    body: JSON.stringify({ optionId, userId }),
  });
}

export async function getNewEvents() {
  const userId = getCurrentUserId();
  return fetchAPI(`/users/events/new?userId=${userId}`);
}

export async function getUserEvents() {
  const userId = getCurrentUserId();
  return fetchAPI(`/users/events?userId=${userId}`);
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Ошибка загрузки файла');
  }
  
  return response.json();
}

export async function getRoomMembers(roomId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/members?userId=${userId}`);
}

export async function getRoomPolls(roomId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/polls?userId=${userId}`);
}

export async function createPoll(roomId, question, options, isAnonymous = false, isMultiple = false) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/polls`, {
    method: 'POST',
    body: JSON.stringify({ question, options, isAnonymous, isMultiple, userId }),
  });
}

export async function votePoll(roomId, pollId, optionIds) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionIds, userId }),
  });
}

export async function getPoll(roomId, pollId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/polls/${pollId}?userId=${userId}`);
}

export async function startVideoSession(roomId, eventId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/start-session`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function restartVideoSession(roomId, eventId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/events/${eventId}/restart-session`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function getFundings(roomId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/fundings?userId=${userId}`);
}

export async function createFunding(roomId, title, description, goal, eventId, pollId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/fundings`, {
    method: "POST",
    body: JSON.stringify({ title, description, goal, eventId, pollId, userId }),
  });
}

export async function contributeFunding(roomId, fundingId, amount, note) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/fundings/${fundingId}/contribute`, {
    method: "POST",
    body: JSON.stringify({ amount, note, userId }),
  });
}

export async function closeFunding(roomId, fundingId) {
  const userId = getCurrentUserId();
  return fetchAPI(`/rooms/${roomId}/fundings/${fundingId}/close`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function closePoll(roomId, pollId) {
  const userId = getCurrentUserId();
  
  return fetchAPI(`/rooms/${roomId}/polls/${pollId}/close`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
