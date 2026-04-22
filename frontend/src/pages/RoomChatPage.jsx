// C:\OSPanel\domains\karny\frontend\src\pages\RoomChatPage.jsx

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../components/common/ThemeProvider'
import * as api from '../api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import RoomChat from '../components/room/chat/RoomChat'

export default function RoomChatPage() {
  const { id } = useParams()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  const [room, setRoom] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Состояния для уведомлений чата
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  useEffect(() => {
    loadRoomData()
    loadNotificationSettings()
  }, [id])

  const loadRoomData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getRoom(id)
      setRoom(data.room)
      setMembers(data.members || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      const data = await api.getChatNotificationSettings(id)
      setNotificationsEnabled(data.enabled)
    } catch (err) {
      setNotificationsEnabled(true)
    }
  }

  const toggleNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const newState = !notificationsEnabled
      await api.setChatNotificationSettings(id, newState)
      setNotificationsEnabled(newState)
    } catch (err) {
      console.error('Ошибка переключения уведомлений:', err)
    } finally {
      setNotificationsLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      {/* Минималистичная шапка */}
      <header className={`flex-shrink-0 ${darkMode ? 'bg-[#1a1a1e] border-b border-[#2a2a30]' : 'bg-white border-b border-gray-200'}`}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link 
              to={`/room/${id}`}
              className={`p-2 -ml-2 rounded-full transition-colors ${
                darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            <div className="flex-1 min-w-0">
              <h1 className={`text-lg font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {room?.name}
              </h1>
            </div>
            
            <button
              onClick={toggleNotifications}
              disabled={notificationsLoading}
              className={`p-2 rounded-full transition-colors ${
                darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'
              }`}
            >
              {notificationsEnabled ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Чат */}
      <div className="flex-1 min-h-0">
        <RoomChat 
          roomId={id} 
          members={members} 
          darkMode={darkMode} 
          autoScrollToBottom={true}
          hideHeader={true}
        />
      </div>
    </div>
  )
}