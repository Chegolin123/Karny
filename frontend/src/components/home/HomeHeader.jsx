// C:\OSPanel\domains\karny\frontend\src\components\home\HomeHeader.jsx

import { getInitials, getAvatarColor } from '../../utils/avatar'
import { useTheme } from '../common/ThemeProvider'

export default function HomeHeader({ user, telegramUser, onOpenSettings, onOpenCalendar }) {
  const displayUser = telegramUser || user
  const photoUrl = displayUser?.photo_url || displayUser?.photoUrl
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  return (
    <header className={`w-full overflow-hidden flex-shrink-0 ${darkMode ? 'bg-gradient-to-r from-[#1e1136] to-[#2d1b4e]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'} text-white shadow-md`}>
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm border-2 border-white/30"
                style={{ backgroundColor: getAvatarColor(displayUser?.first_name) }}
              >
                {getInitials(displayUser?.first_name, displayUser?.last_name)}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {displayUser ? (
                <p className="text-sm font-medium text-white/90 truncate">
                  {displayUser.first_name} {displayUser.last_name || ''}
                </p>
              ) : (
                <p className="text-lg font-semibold">🎉 Karny</p>
              )}
              {displayUser?.username && (
                <p className="text-xs text-white/60 truncate">@{displayUser.username}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Кнопка календаря */}
            <button
              onClick={onOpenCalendar}
              className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              title="Календарь событий"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* Кнопка настроек */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              title="Настройки"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}