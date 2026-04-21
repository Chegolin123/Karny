// C:\OSPanel\domains\karny\frontend\src\components\common\ThemeToggle.jsx

import { useState } from 'react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle({ darkMode }) {
  const { theme, toggleTheme, resetToSystem, userPreference } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-2 rounded-lg transition-colors ${
          darkMode 
            ? 'text-gray-400 hover:text-white hover:bg-[#2a2a30]' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title="Тема оформления"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50 overflow-hidden ${
            darkMode 
              ? 'bg-[#1a1a1e] border-[#2a2a30]' 
              : 'bg-white border-gray-200'
          }`}>
            <button
              onClick={() => {
                toggleTheme()
                setShowMenu(false)
              }}
              className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${
                darkMode 
                  ? 'hover:bg-[#2a2a30] text-gray-300' 
                  : 'hover:bg-gray-50 text-gray-700'
              } ${!userPreference ? (darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]') : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Тёмная тема</span>
              {theme === 'dark' && !userPreference && (
                <span className="ml-auto text-xs opacity-60">системная</span>
              )}
              {userPreference === 'dark' && (
                <span className="ml-auto text-[#8b5cf6]">✓</span>
              )}
            </button>
            
            <button
              onClick={() => {
                if (theme === 'dark') toggleTheme()
                setShowMenu(false)
              }}
              className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${
                darkMode 
                  ? 'hover:bg-[#2a2a30] text-gray-300' 
                  : 'hover:bg-gray-50 text-gray-700'
              } ${userPreference === 'light' ? (darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]') : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Светлая тема</span>
              {theme === 'light' && !userPreference && (
                <span className="ml-auto text-xs opacity-60">системная</span>
              )}
              {userPreference === 'light' && (
                <span className="ml-auto text-[#8b5cf6]">✓</span>
              )}
            </button>
            
            {userPreference && (
              <button
                onClick={() => {
                  resetToSystem()
                  setShowMenu(false)
                }}
                className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 border-t transition-colors ${
                  darkMode 
                    ? 'border-[#2a2a30] hover:bg-[#2a2a30] text-gray-400' 
                    : 'border-gray-100 hover:bg-gray-50 text-gray-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Как в системе</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}