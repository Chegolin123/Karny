// C:\OSPanel\domains\karny\frontend\src\pages\ProfilePage.jsx

import { useState } from 'react'
import { useTheme } from '../components/common/ThemeProvider'
import { useTelegram } from '../hooks/useTelegram'
import { useHome } from '../hooks/useHome'
import { useNotification } from '../contexts/NotificationContext'

export default function ProfilePage() {
  const { theme: actualTheme, themePreference, setTheme } = useTheme()
  const darkMode = actualTheme === 'dark'
  const { telegramUser } = useTelegram()
  const { user } = useHome()
  const { notifySuccess } = useNotification()
  
  const displayUser = telegramUser || user
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  
  const handleClearCache = () => {
    if (confirm('Очистить кэш приложения?')) {
      localStorage.clear()
      notifySuccess('Кэш очищен')
    }
  }
  
  const handleLogout = () => {
    if (confirm('Выйти из аккаунта?')) {
      localStorage.clear()
      window.Telegram?.WebApp?.close()
      window.location.reload()
    }
  }
  
  const getAvatarColor = (name) => {
    if (!name) return '#8b5cf6'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 50%)`
  }
  
  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
    if (firstName) return firstName.substring(0, 2).toUpperCase()
    return '?'
  }
  
  return (
    <div className={`h-full overflow-hidden flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      {/* Шапка */}
      <header className={`flex-shrink-0 px-4 pt-2 pb-2 ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`}>
        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Профиль
        </h1>
      </header>
      
      {/* Контент */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Карточка пользователя */}
        <div className="px-4 py-6">
          <div className="flex flex-col items-center">
            {displayUser?.photo_url ? (
              <img
                src={displayUser.photo_url}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-[#8b5cf6] shadow-lg"
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-[#8b5cf6] shadow-lg"
                style={{ backgroundColor: getAvatarColor(displayUser?.first_name) }}
              >
                {getInitials(displayUser?.first_name, displayUser?.last_name)}
              </div>
            )}
            
            <h2 className={`text-xl font-semibold mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {displayUser?.first_name} {displayUser?.last_name || ''}
            </h2>
            
            {displayUser?.username && (
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                @{displayUser.username}
              </p>
            )}
          </div>
        </div>
        
        {/* Раздел настроек */}
        <div className="px-4 space-y-6 pb-8">
          {/* Оформление - СТАРЫЙ ДИЗАЙН С КАРТОЧКАМИ */}
          <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Оформление
              </h3>
            </div>
            
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    themePreference === 'light'
                      ? darkMode ? 'border-[#a78bfa] bg-[#2d1b4e]' : 'border-[#8b5cf6] bg-[#f5f3ff]'
                      : darkMode ? 'border-[#2a2a30]' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className={`text-sm font-medium ${themePreference === 'light' ? (darkMode ? 'text-[#c4b5fd]' : 'text-[#6d28d9]') : ''}`}>
                      Светлая
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    themePreference === 'dark'
                      ? darkMode ? 'border-[#a78bfa] bg-[#2d1b4e]' : 'border-[#8b5cf6] bg-[#f5f3ff]'
                      : darkMode ? 'border-[#2a2a30]' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className={`text-sm font-medium ${themePreference === 'dark' ? (darkMode ? 'text-[#c4b5fd]' : 'text-[#6d28d9]') : ''}`}>
                      Тёмная
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setTheme('system')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    themePreference === 'system'
                      ? darkMode ? 'border-[#a78bfa] bg-[#2d1b4e]' : 'border-[#8b5cf6] bg-[#f5f3ff]'
                      : darkMode ? 'border-[#2a2a30]' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-sm font-medium ${themePreference === 'system' ? (darkMode ? 'text-[#c4b5fd]' : 'text-[#6d28d9]') : ''}`}>
                      Системная
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Уведомления */}
          <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Уведомления
              </h3>
            </div>
            
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>Push-уведомления</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-[#8b5cf6]' : darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔊</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>Звуки</span>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    soundEnabled ? 'bg-[#8b5cf6]' : darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📳</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>Вибрация</span>
                </div>
                <button
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    vibrationEnabled ? 'bg-[#8b5cf6]' : darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    vibrationEnabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Данные */}
          <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Данные
              </h3>
            </div>
            
            <div className="p-2">
              <button
                onClick={handleClearCache}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">🗑️</span>
                <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Очистить кэш</span>
              </button>
            </div>
          </div>
          
          {/* О приложении */}
          <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
            <div className="p-2">
              <div className="px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>Версия</span>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>1.3.1</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Выход */}
          <button
            onClick={handleLogout}
            className={`w-full py-4 px-4 rounded-xl font-medium text-red-500 transition-colors ${
              darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
            }`}
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  )
}