// C:\OSPanel\domains\karny\frontend\src\components\room\RoomHeader.jsx

import { Link } from 'react-router-dom'
import ThemeToggle from '../common/ThemeToggle'
import { useTheme } from '../common/ThemeProvider'

export default function RoomHeader({ 
  room, 
  membersCount, 
  copied, 
  onCopyCode, 
  onShare,
  isOwner,
  onEditRoom,
  roomId
}) {
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  return (
    <header className={`${darkMode ? 'bg-gradient-to-r from-[#1e1136] to-[#2d1b4e]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'} text-white`}>
      <div className="max-w-2xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Назад
          </Link>
          
          <ThemeToggle darkMode={true} />
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight">{room?.name}</h1>
              {isOwner && (
                <button
                  onClick={onEditRoom}
                  className="p-1 text-white/60 hover:text-white transition-colors"
                  title="Редактировать комнату"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={onCopyCode}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <span className="bg-white/10 px-2 py-1 rounded-lg font-mono">{room?.code}</span>
                <span className="text-xs">{copied ? '✓' : '📋'}</span>
              </button>
              <span className="text-sm text-white/50">{membersCount} участников</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Кнопка чата */}
            <Link
              to={`/room/${roomId}/chat`}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="Открыть чат комнаты"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
            
            {/* Кнопка "Поделиться" */}
            <button
              onClick={onShare}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="Поделиться"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}