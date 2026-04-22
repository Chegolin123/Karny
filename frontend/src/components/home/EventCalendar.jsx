// C:\OSPanel\domains\karny\frontend\src\components\home\EventCalendar.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../api'

// Дни недели
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

export default function EventCalendar({ darkMode, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  
  useEffect(() => {
    loadEvents()
  }, [])
  
  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await api.getUserEvents()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Ошибка загрузки событий:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Получить дни месяца
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    const startDay = firstDay.getDay() || 7 // Пн=1, Вс=7
    
    // Пустые ячейки в начале
    for (let i = 1; i < startDay; i++) {
      days.push(null)
    }
    
    // Дни месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }
  
  // Получить события на конкретную дату
  const getEventsForDate = (date) => {
    if (!date) return []
    return events.filter(event => {
      if (!event.event_date) return false
      const eventDate = new Date(event.event_date)
      return eventDate.toDateString() === date.toDateString()
    })
  }
  
  // События на выбранную дату
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  
  // Переключение месяца
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }
  
  const days = getDaysInMonth(currentDate)
  const today = new Date()
  
  // Проверить, есть ли события в дне
  const hasEvents = (date) => {
    return getEventsForDate(date).length > 0
  }
  
  // Форматирование даты
  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
      {/* Заголовок */}
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Календарь событий
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className={`text-sm font-medium min-w-[120px] text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={nextMonth}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {WEEKDAYS.map(day => (
              <div key={day} className={`text-center text-xs font-medium py-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Ячейки календаря */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }
              
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
              const dayEvents = getEventsForDate(date)
              const hasEvent = dayEvents.length > 0
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all relative ${
                    isSelected
                      ? darkMode ? 'bg-[#2d1b4e] text-[#c4b5fd]' : 'bg-[#f5f3ff] text-[#6d28d9]'
                      : isToday
                        ? darkMode ? 'bg-[#2a2a30] text-white border border-[#3f3f46]' : 'bg-gray-100 text-gray-900'
                        : darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                    {date.getDate()}
                  </span>
                  {hasEvent && (
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-[#a78bfa]' : 'bg-[#8b5cf6]'}`} />
                  )}
                </button>
              )
            })}
          </div>
          
          {/* События выбранного дня */}
          {selectedDate && (
            <div className={`p-4 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
              <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </h4>
              
              {selectedDateEvents.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Нет событий на эту дату
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map(event => (
                    <Link
                      key={event.id}
                      to={`/room/${event.room_id}/event/${event.id}`}
                      className={`block p-3 rounded-xl transition-colors ${darkMode ? 'bg-[#2a2a30] hover:bg-[#3f3f46]' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${darkMode ? 'bg-[#a78bfa]' : 'bg-[#8b5cf6]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {event.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {event.room_name} • {formatEventDate(event.event_date)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}