// C:\OSPanel\domains\karny\frontend\src\components\dashboard\WelcomeHeader.jsx

import { getInitials, getAvatarColor } from '../../utils/avatar'
import { useTelegram } from '../../hooks/useTelegram'
import { useHome } from '../../hooks/useHome'

export default function WelcomeHeader({ darkMode }) {
  const { telegramUser } = useTelegram()
  const { user } = useHome()
  
  const displayUser = telegramUser || user
  const photoUrl = displayUser?.photo_url || displayUser?.photoUrl
  
  // Получаем время суток для приветствия
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Доброй ночи'
    if (hour < 12) return 'Доброе утро'
    if (hour < 18) return 'Добрый день'
    return 'Добрый вечер'
  }
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1">
        <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {getGreeting()}, {displayUser?.first_name || 'Гость'}! 👋
        </h1>
        {displayUser?.username && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            @{displayUser.username}
          </p>
        )}
      </div>
      
      <div className="flex-shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover border-2 border-[#8b5cf6]"
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium border-2 border-[#8b5cf6]"
            style={{ backgroundColor: getAvatarColor(displayUser?.first_name) }}
          >
            {getInitials(displayUser?.first_name, displayUser?.last_name)}
          </div>
        )}
      </div>
    </div>
  )
}