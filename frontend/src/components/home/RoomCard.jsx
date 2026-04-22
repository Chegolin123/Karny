// C:\OSPanel\domains\karny\frontend\src\components\home\RoomCard.jsx

import { Link } from 'react-router-dom'

export default function RoomCard({ room, darkMode, showJoinButton, onJoin }) {
  const isMember = room.is_member !== false
  
  return (
    <div className="card group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link to={isMember ? `/room/${room.id}` : '#'} className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {room.name}
            </h3>
            {room.is_private ? (
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                darkMode 
                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' 
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              }`}>
                🔒 Приватная
              </span>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                darkMode 
                  ? 'bg-green-900/30 text-green-400 border border-green-700' 
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                🌍 Публичная
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-sm font-mono px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              darkMode 
                ? 'bg-[#2d1b4e] text-[#c4b5fd] border border-[#4c1d95]' 
                : 'bg-[#f5f3ff] text-[#6d28d9] border border-[#c4b5fd]'
            }`}>
              {room.code}
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap ${
              darkMode 
                ? 'bg-[#2a2a30] text-gray-300 border border-[#3f3f46]' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm font-medium">{room.members_count || 1}</span>
            </div>
            {isMember && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                darkMode 
                  ? 'bg-green-900/30 text-green-400 border border-green-700' 
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                ✓ Вы участник
              </span>
            )}
          </div>
        </Link>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isMember && showJoinButton ? (
            <button
              onClick={() => onJoin(room)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                darkMode 
                  ? 'bg-[#2d1b4e] text-[#c4b5fd] hover:bg-[#3d2563] border border-[#4c1d95]' 
                  : 'bg-[#f5f3ff] text-[#6d28d9] hover:bg-[#ede9fe] border border-[#c4b5fd]'
              }`}
            >
              Вступить
            </button>
          ) : (
            <>
              <Link
                to={`/room/${room.id}/chat`}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#2a2a30] text-[#a78bfa] hover:bg-[#3f3f46] border border-[#3f3f46]' 
                    : 'bg-gray-100 text-[#6d28d9] hover:bg-gray-200 border border-gray-200'
                }`}
                title="Открыть чат"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
              
              <Link
                to={`/room/${room.id}`}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#2a2a30] text-[#a78bfa] hover:bg-[#3f3f46] border border-[#3f3f46]' 
                    : 'bg-gray-100 text-[#6d28d9] hover:bg-gray-200 border border-gray-200'
                }`}
                title="Открыть комнату"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}