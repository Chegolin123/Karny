// C:\OSPanel\domains\karny\frontend\src\components\dashboard\ActiveChatsWidget.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../api'
import MemberAvatar from '../room/MemberAvatar'

export default function ActiveChatsWidget({ darkMode }) {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadChats()
  }, [])
  
  const loadChats = async () => {
    try {
      setLoading(true)
      const data = await api.getRooms()
      // Берём комнаты с последними сообщениями (если есть)
      const rooms = (data.rooms || []).slice(0, 3)
      setChats(rooms)
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const formatLastMessage = (room) => {
    if (!room.last_message) return 'Нет сообщений'
    const sender = room.last_message_sender || 'Участник'
    const text = room.last_message.length > 30 
      ? room.last_message.substring(0, 30) + '...' 
      : room.last_message
    return `${sender}: ${text}`
  }
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          💬 Активные чаты
        </h2>
        <Link 
          to="/chats" 
          className={`text-sm ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}
        >
          Все →
        </Link>
      </div>
      
      {loading ? (
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-gray-100'}`}>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : chats.length === 0 ? (
        <div className={`p-6 rounded-xl text-center ${darkMode ? 'bg-[#1a1a1e]' : 'bg-gray-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            У вас пока нет чатов
          </p>
          <Link 
            to="/rooms" 
            className={`text-sm mt-2 inline-block ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}
          >
            Найти комнату →
          </Link>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-gray-100'}`}>
          {chats.map((chat, index) => (
            <Link
              key={chat.id}
              to={`/room/${chat.id}/chat`}
              className={`flex items-center gap-3 p-3 transition-colors ${
                darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-200'
              } ${index !== chats.length - 1 ? (darkMode ? 'border-b border-[#2a2a30]' : 'border-b border-gray-200') : ''}`}
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                  darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                }`}>
                  {chat.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {chat.name}
                  </p>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {chat.members_count || 1} 👥
                  </span>
                </div>
                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatLastMessage(chat)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}