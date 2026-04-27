// C:\OSPanel\domains\karny\frontend\src\components\dashboard\RecommendedRoomsWidget.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../api'

export default function RecommendedRoomsWidget({ darkMode }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadRooms()
  }, [])
  
  const loadRooms = async () => {
    try {
      setLoading(true)
      const data = await api.getPublicRooms()
      // Берём публичные комнаты с наибольшим количеством участников
      const popularRooms = (data.rooms || [])
        .filter(r => !r.is_member)
        .sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
        .slice(0, 3)
      setRooms(popularRooms)
    } catch (err) {
      console.error('Ошибка загрузки комнат:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          🌍 Рекомендованные комнаты
        </h2>
        <Link 
          to="/rooms" 
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
      ) : rooms.length === 0 ? (
        <div className={`p-6 rounded-xl text-center ${darkMode ? 'bg-[#1a1a1e]' : 'bg-gray-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Пока нет рекомендованных комнат
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {rooms.map(room => (
            <Link
              key={room.id}
              to={`/room/${room.id}`}
              className={`p-4 rounded-xl transition-colors ${
                darkMode ? 'bg-[#1a1a1e] hover:bg-[#2a2a30]' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {room.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {room.code}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      👥 {room.members_count || 1}
                    </span>
                  </div>
                </div>
                <span className={`text-sm ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}>
                  Вступить →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}