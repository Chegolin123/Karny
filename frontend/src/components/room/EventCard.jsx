// C:\OSPanel\domains\karny\frontend\src\components\room\EventCard.jsx

import { Link } from 'react-router-dom'
import { formatEventDate } from '../../utils/formatters'

// Функция проверки новизны (создано в последние 24 часа)
function isNewEvent(createdAt) {
  if (!createdAt) return false
  const created = new Date(createdAt)
  const now = new Date()
  const diff = now - created
  return diff < 24 * 60 * 60 * 1000 // 24 часа
}

export default function EventCard({ 
  event, 
  userStatus,
  darkMode,
  roomId
}) {
  const isNew = isNewEvent(event.created_at)
  
  return (
    <Link
      to={`/room/${roomId}/event/${event.id}`}
      className="card w-full overflow-hidden block hover:border-[#8b5cf6] transition-all relative"
    >
      {/* Индикатор новизны */}
      {isNew && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            darkMode 
              ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white' 
              : 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white'
          }`}>
            NEW
          </span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base sm:text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {event.name}
            </h3>
            {event.time_voting_enabled && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                darkMode 
                  ? 'bg-purple-900/30 text-purple-400 border border-purple-700' 
                  : 'bg-purple-100 text-purple-700 border border-purple-300'
              }`}>
                🗳️
              </span>
            )}
          </div>
          {event.description && (
            <p className={`text-sm sm:text-base mt-1 line-clamp-2 break-word ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {event.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Счётчик идущих */}
          <span className={`text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors whitespace-nowrap ${
            darkMode 
              ? 'bg-green-900/30 text-green-400 border border-green-700' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            ✅ {event.going_count || 0}
          </span>
          
          {/* Индикатор статуса пользователя */}
          {userStatus && (
            <span className={`text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl whitespace-nowrap ${
              userStatus === 'going'
                ? darkMode 
                  ? 'bg-green-900/30 text-green-400 border border-green-700' 
                  : 'bg-green-100 text-green-700 border border-green-300'
                : userStatus === 'maybe'
                  ? darkMode 
                    ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' 
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  : darkMode 
                    ? 'bg-red-900/30 text-red-400 border border-red-700' 
                    : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {userStatus === 'going' ? '✓ Иду' : userStatus === 'maybe' ? '🤔 Возможно' : '❌ Не иду'}
            </span>
          )}
        </div>
      </div>
      
      {event.time_voting_enabled ? (
        <p className={`text-sm sm:text-base font-medium mb-4 flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          🗳️ Время обсуждается
        </p>
      ) : (
        <p className={`text-sm sm:text-base font-medium mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{formatEventDate(event.event_date)}</span>
        </p>
      )}
    </Link>
  )
}