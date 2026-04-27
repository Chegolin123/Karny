// C:\OSPanel\domains\karny\frontend\src\components\dashboard\ActiveChatsList.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAvatarColor } from '../../utils/avatar'
import * as api from '../../api'

export default function ActiveChatsList({ darkMode }) {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [imgErrors, setImgErrors] = useState({})
  
  useEffect(() => {
    loadChats()
  }, [])
  
  const loadChats = async () => {
    try {
      setLoading(true)
      const data = await api.getRooms()
      setChats((data.rooms || []).slice(0, 3))
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'только что'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  }
  
  const handleImageError = (roomId) => {
    setImgErrors(prev => ({ ...prev, [roomId]: true }))
  }
  
  if (loading) {
    return (
      <div className={`mx-4 mb-4 p-4 rounded-2xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }
  
  if (chats.length === 0) {
    return (
      <div className={`mx-4 mb-4 p-4 rounded-2xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
        <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          У вас пока нет чатов
        </p>
      </div>
    )
  }
  
  return (
    <div className={`mx-4 mb-4 rounded-2xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
        <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          💬 Активные чаты
        </h2>
      </div>
      
      {chats.map((chat, index) => {
        const hasImageError = imgErrors[chat.id]
        
        return (
          <Link
            key={chat.id}
            to={`/room/${chat.id}/chat`}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-50'
            } ${index !== chats.length - 1 ? (darkMode ? 'border-b border-[#2a2a30]' : 'border-b border-gray-100') : ''}`}
          >
            {/* Аватар комнаты */}
            {chat.photo_url && !hasImageError ? (
              <img
                src={chat.photo_url}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                onError={() => handleImageError(chat.id)}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                style={{ backgroundColor: getAvatarColor(chat.name) }}
              >
                {chat.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {chat.name}
                </p>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(chat.last_message_time)}
                </span>
              </div>
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {chat.last_message || 'Нет сообщений'}
              </p>
            </div>
          </Link>
        )
      })}
      
      <Link
        to="/chats"
        className={`block text-center py-3 text-sm font-medium border-t ${
          darkMode ? 'border-[#2a2a30] text-[#a78bfa]' : 'border-gray-200 text-[#8b5cf6]'
        }`}
      >
        Все чаты →
      </Link>
    </div>
  )
}