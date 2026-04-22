// C:\OSPanel\domains\karny\frontend\src\components\room\chat\ChatHeader.jsx

import { useState, useEffect } from 'react'
import * as api from '../../../api'

/**
 * Компактный заголовок чата
 * Показывает статус подключения и кнопку уведомлений
 */
export default function ChatHeader({ connected, darkMode, roomId }) {
  const currentUserId = api.getCurrentUserId()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [roomId])

  const loadSettings = async () => {
    try {
      const data = await api.getChatNotificationSettings(roomId)
      setNotificationsEnabled(data.enabled)
    } catch (err) {
      // По умолчанию включены
      setNotificationsEnabled(true)
    }
  }

  const toggleNotifications = async () => {
    setLoading(true)
    try {
      const newState = !notificationsEnabled
      await api.setChatNotificationSettings(roomId, newState)
      setNotificationsEnabled(newState)
    } catch (err) {
      console.error('Ошибка переключения уведомлений:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex-shrink-0 px-2 py-1 border-b ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-end gap-1">
        {/* Кнопка уведомлений */}
        <button
          onClick={toggleNotifications}
          disabled={loading}
          className={`p-1 rounded transition-colors ${
            darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'
          }`}
          title={notificationsEnabled ? 'Уведомления включены' : 'Уведомления выключены'}
        >
          {notificationsEnabled ? (
            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          )}
        </button>
        
        {/* Индикатор статуса */}
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
      </div>
    </div>
  )
}