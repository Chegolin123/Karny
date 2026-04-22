// C:\OSPanel\domains\karny\frontend\src\components\common\AppSettingsModal.jsx

import { useState } from 'react'
import { useTheme } from './ThemeProvider'

export default function AppSettingsModal({ show, onClose }) {
  const { theme, setTheme, toggleTheme } = useTheme()
  const darkMode = theme === 'dark'
  
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    return localStorage.getItem('karny_vibration') !== 'false'
  })
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('karny_sound') !== 'false'
  })
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('karny_compact') === 'true'
  })

  const handleVibrationToggle = () => {
    const newValue = !vibrationEnabled
    setVibrationEnabled(newValue)
    localStorage.setItem('karny_vibration', newValue)
  }

  const handleSoundToggle = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('karny_sound', newValue)
  }

  const handleCompactToggle = () => {
    const newValue = !compactMode
    setCompactMode(newValue)
    localStorage.setItem('karny_compact', newValue)
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('karny_theme', newTheme)
  }

  const handleClearCache = () => {
    if (confirm('Очистить кэш приложения?')) {
      // Очищаем localStorage кроме темы и настроек
      const theme = localStorage.getItem('karny_theme')
      const vibration = localStorage.getItem('karny_vibration')
      const sound = localStorage.getItem('karny_sound')
      const compact = localStorage.getItem('karny_compact')
      
      localStorage.clear()
      
      if (theme) localStorage.setItem('karny_theme', theme)
      if (vibration) localStorage.setItem('karny_vibration', vibration)
      if (sound) localStorage.setItem('karny_sound', sound)
      if (compact) localStorage.setItem('karny_compact', compact)
      
      alert('Кэш очищен')
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      } animate-slideUp`}>
        
        {/* Заголовок */}
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Настройки
            </h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-[#2a2a30] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Тема */}
          <div>
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Оформление
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? darkMode ? 'border-[#a78bfa] bg-[#2d1b4e]' : 'border-[#8b5cf6] bg-[#f5f3ff]'
                    : darkMode ? 'border-[#2a2a30]' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className={`text-sm font-medium ${theme === 'light' ? (darkMode ? 'text-[#c4b5fd]' : 'text-[#6d28d9]') : ''}`}>
                    Светлая
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? darkMode ? 'border-[#a78bfa] bg-[#2d1b4e]' : 'border-[#8b5cf6] bg-[#f5f3ff]'
                    : darkMode ? 'border-[#2a2a30]' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className={`text-sm font-medium ${theme === 'dark' ? (darkMode ? 'text-[#c4b5fd]' : 'text-[#6d28d9]') : ''}`}>
                    Тёмная
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  theme === 'system'
                    ? darkMode ? 'border-[#a78bfa] bg-[#2d1b4e]' : 'border-[#8b5cf6] bg-[#f5f3ff]'
                    : darkMode ? 'border-[#2a2a30]' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-sm font-medium ${theme === 'system' ? (darkMode ? 'text-[#c4b5fd]' : 'text-[#6d28d9]') : ''}`}>
                    Системная
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Поведение */}
          <div>
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Поведение
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Вибрация
                  </span>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Тактильный отклик при действиях
                  </p>
                </div>
                <button
                  onClick={handleVibrationToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    vibrationEnabled 
                      ? 'bg-[#8b5cf6]' 
                      : darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    vibrationEnabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Звуки
                  </span>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Звуковые эффекты интерфейса
                  </p>
                </div>
                <button
                  onClick={handleSoundToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    soundEnabled 
                      ? 'bg-[#8b5cf6]' 
                      : darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Компактный режим
                  </span>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Уменьшенные отступы и размеры
                  </p>
                </div>
                <button
                  onClick={handleCompactToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    compactMode 
                      ? 'bg-[#8b5cf6]' 
                      : darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    compactMode ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* О приложении */}
          <div>
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              О приложении
            </h3>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-[#2a2a30]' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Karny</strong> v1.0.0
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Планирование встреч и общение с друзьями
              </p>
            </div>
          </div>

          {/* Очистка кэша */}
          <div>
            <button
              onClick={handleClearCache}
              className={`w-full py-3 text-sm font-medium rounded-xl transition-colors ${
                darkMode 
                  ? 'text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20' 
                  : 'text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50'
              }`}
            >
              Очистить кэш
            </button>
          </div>
        </div>
        
        {/* Кнопка закрытия */}
        <div className={`p-5 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}