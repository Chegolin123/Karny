// C:\OSPanel\domains\karny\frontend\src\components\layout\MainLayout.jsx

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../common/ThemeProvider'

const tabs = [
  { path: '/', icon: '🏠', label: 'Главная' },
  { path: '/rooms', icon: '🏢', label: 'Комнаты' },
  { path: '/chats', icon: '💬', label: 'Чаты' },
  { path: '/profile', icon: '👤', label: 'Профиль' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }
  
  return (
    <div className="h-screen flex flex-col">
      {/* Основной контент */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
      
      {/* Нижнее меню */}
      <nav className={`flex-shrink-0 border-t safe-area-pb ${
        darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-around">
          {tabs.map(tab => {
            const active = isActive(tab.path)
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
                  active
                    ? darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}