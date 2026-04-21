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

  useEffect(() => {
    loadRoomData()
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

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      {/* Фиксированная шапка */}
      <header className={`flex-shrink-0 ${darkMode ? 'bg-gradient-to-r from-[#1e1136] to-[#2d1b4e]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'} text-white`}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Link 
              to={`/room/${id}`}
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Назад в комнату
            </Link>
            <h1 className="text-lg font-medium truncate">
              {room?.name} — Чат
            </h1>
          </div>
        </div>
      </header>

      {/* Чат с автоскроллом вниз */}
      <div className="flex-1 min-h-0">
        <RoomChat 
          roomId={id} 
          members={members} 
          darkMode={darkMode} 
          autoScrollToBottom={true}
        />
      </div>
    </div>
  )
}