// C:\OSPanel\domains\karny\frontend\src\components\room\chat\MessageBubble.jsx

import MemberAvatar from '../MemberAvatar'

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  sender, 
  showAvatar, 
  showName, 
  darkMode 
}) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Аватар для чужих сообщений */}
      {!isOwn && (
        <div className="w-7 h-7 flex-shrink-0">
          {showAvatar && sender ? (
            <MemberAvatar member={sender} size="sm" />
          ) : (
            <div className="w-7 h-7" />
          )}
        </div>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
        {/* Имя отправителя */}
        {showName && sender && (
          <span className={`text-xs ml-1 mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {sender.first_name} {sender.last_name || ''}
          </span>
        )}
        
        <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {/* Время для своих сообщений */}
          {isOwn && (
            <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatTime(message.timestamp || message.created_at)}
            </span>
          )}
          
          {/* Облачко сообщения */}
          <div className={`px-3 py-2 rounded-2xl break-words ${
            isOwn 
              ? 'bg-[#6d28d9] text-white rounded-br-md' 
              : darkMode 
                ? 'bg-[#2a2a30] text-white rounded-bl-md' 
                : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
          }`}>
            {message.content}
          </div>
          
          {/* Время для чужих сообщений */}
          {!isOwn && (
            <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatTime(message.timestamp || message.created_at)}
            </span>
          )}
        </div>
      </div>
      
      {/* Пустой placeholder для своих сообщений */}
      {isOwn && <div className="w-7 h-7 flex-shrink-0" />}
    </div>
  )
}