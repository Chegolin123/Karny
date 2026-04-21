// C:\OSPanel\domains\karny\frontend\src\components\home\HomeHeader.jsx

import { getInitials, getAvatarColor } from '../../utils/avatar'
import ThemeToggle from '../common/ThemeToggle'
import { useTheme } from '../common/ThemeProvider'

export default function HomeHeader({ user, telegramUser }) {
  const displayUser = telegramUser || user
  const photoUrl = displayUser?.photo_url || displayUser?.photoUrl
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  return (
    <header className={`${darkMode ? 'bg-gradient-to-r from-[#1e1136] to-[#2d1b4e]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'} text-white`}>
      <div className="max-w-2xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm border-2 border-white/30"
                style={{ backgroundColor: getAvatarColor(displayUser?.first_name) }}
              >
                {getInitials(displayUser?.first_name, displayUser?.last_name)}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {displayUser && (
                <p className="text-sm text-white/90 truncate">
                  {displayUser.first_name} {displayUser.last_name || ''}
                  {displayUser.username && <span className="ml-1 text-white/70">@{displayUser.username}</span>}
                </p>
              )}
            </div>
          </div>
          
          <ThemeToggle darkMode={true} />
        </div>
      </div>
    </header>
  )
}