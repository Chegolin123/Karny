// C:\OSPanel\domains\karny\frontend\src\components\dashboard\UpcomingEventsWidget.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../api'

function formatEventDate(dateStr) {
  if (!dateStr) return 'Время обсуждается'
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) {
    return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Завтра, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export default function UpcomingEventsWidget({ darkMode }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadEvents()
  }, [])
  
  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await api.getUserEvents()
      // Фильтруем события с датой и сортируем по ближайшим
      const upcomingEvents = (data.events || [])
        .filter(e => e.event_date)
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 5)
      setEvents(upcomingEvents)
    } catch (err) {
      console.error('Ошибка загрузки событий:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📅 Ближайшие события
        </h2>
        <Link 
          to="/calendar" 
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
      ) : events.length === 0 ? (
        <div className={`p-6 rounded-xl text-center ${darkMode ? 'bg-[#1a1a1e]' : 'bg-gray-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Нет запланированных событий
          </p>
          <Link 
            to="/rooms" 
            className={`text-sm mt-2 inline-block ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}
          >
            Создать событие →
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {events.map(event => (
            <Link
              key={event.id}
              to={`/room/${event.room_id}/event/${event.id}`}
              className={`flex-shrink-0 w-64 p-4 rounded-xl transition-colors ${
                darkMode ? 'bg-[#1a1a1e] hover:bg-[#2a2a30]' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">📅</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {event.name}
                  </p>
                  <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {event.room_name}
                  </p>
                </div>
              </div>
              <p className={`text-xs ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}>
                {formatEventDate(event.event_date)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  👥 {event.going_count || 0} идут
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}