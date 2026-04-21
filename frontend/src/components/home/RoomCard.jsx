// C:\OSPanel\domains\karny\frontend\src\components\home\RoomCard.jsx

import { Link } from 'react-router-dom'

export default function RoomCard({ room, darkMode }) {
  return (
    <div className={`block border rounded-lg p-4 transition-all ${
      darkMode 
        ? 'bg-[#1a1a1e] border-[#2a2a30] hover:border-[#8b5cf6]' 
        : 'bg-white border-gray-200 hover:border-[#8b5cf6] hover:shadow-sm'
    }`}>
      <div className="flex items-center justify-between">
        <Link to={`/room/${room.id}`} className="flex-1">
          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {room.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              darkMode 
                ? 'bg-[#2d1b4e] text-[#a78bfa]' 
                : 'bg-[#f5f3ff] text-[#6d28d9]'
            }`}>
              {room.code}
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {room.members_count || 1} участников
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-1">
          {/* Кнопка чата */}
          <Link
            to={`/room/${room.id}/chat`}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-[#a78bfa] hover:bg-[#2a2a30]' 
                : 'text-gray-400 hover:text-[#8b5cf6] hover:bg-gray-100'
            }`}
            title="Открыть чат комнаты"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Link>
          
          {/* Стрелка для перехода в комнату */}
          <Link
            to={`/room/${room.id}`}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-[#a78bfa] hover:bg-[#2a2a30]' 
                : 'text-gray-400 hover:text-[#8b5cf6] hover:bg-gray-100'
            }`}
            title="Открыть комнату"
          >
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}