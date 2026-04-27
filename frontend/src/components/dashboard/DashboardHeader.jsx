// C:\OSPanel\domains\karny\frontend\src\components\dashboard\DashboardHeader.jsx

import { getInitials, getAvatarColor } from '../../utils/avatar'
import { useTelegram } from '../../hooks/useTelegram'
import { useHome } from '../../hooks/useHome'

export default function DashboardHeader({ darkMode, stats }) {
  const { telegramUser } = useTelegram()
  const { user } = useHome()
  
  const displayUser = telegramUser || user
  const photoUrl = displayUser?.photo_url || displayUser?.photoUrl
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Доброй ночи'
    if (hour < 12) return 'Доброе утро'
    if (hour < 18) return 'Добрый день'
    return 'Добрый вечер'
  }
  
  return (
    <div className={`px-4 py-4 ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'} border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-[#8b5cf6]"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg border-2 border-[#8b5cf6]"
              style={{ backgroundColor: getAvatarColor(displayUser?.first_name) }}
            >
              {getInitials(displayUser?.first_name, displayUser?.last_name)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getGreeting()}, {displayUser?.first_name || 'Гость'}! 👋
          </h1>
          {stats && (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {stats.roomsCount} {pluralize(stats.roomsCount, 'комната', 'комнаты', 'комнат')} · 
              {stats.todayEventsCount} {pluralize(stats.todayEventsCount, 'событие', 'события', 'событий')} сегодня
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function pluralize(count, one, two, five) {
  if (count % 10 === 1 && count % 100 !== 11) return one
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return two
  return five
}