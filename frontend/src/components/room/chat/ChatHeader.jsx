// C:\OSPanel\domains\karny\frontend\src\components\room\chat\ChatHeader.jsx

import { Link } from 'react-router-dom'

export default function ChatHeader({ 
  connected, 
  darkMode, 
  roomId, 
  onBack, 
  onPollClick 
}) {
  return (
    <header className={`flex-shrink-0 px-4 py-3 border-b ${
      darkMode 
        ? 'bg-[#1a1a1e] border-[#2a2a30]' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Кнопка назад */}
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 -ml-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-[#2a2a30] text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Чат комнаты
            </h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {connected ? 'Онлайн' : 'Подключение...'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Кнопка создания опроса */}
          {onPollClick && (
            <button
              onClick={onPollClick}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-[#2a2a30] text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Создать опрос"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </button>
          )}
          
          {/* Кнопка настроек комнаты */}
          <Link
            to={`/room/${roomId}`}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-[#2a2a30] text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Настройки комнаты"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}