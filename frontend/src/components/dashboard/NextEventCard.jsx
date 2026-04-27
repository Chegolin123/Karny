// C:\OSPanel\domains\karny\frontend\src\components\dashboard\NextEventCard.jsx

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../api'

function formatEventDate(dateStr) {
  if (!dateStr) return null
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
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + 
         `, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
}

export default function NextEventCard({ darkMode, onAttend }) {
  const [events, setEvents] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userStatuses, setUserStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Для свайпов
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const sliderRef = useRef(null)
  
  const minSwipeDistance = 50 // Минимальное расстояние для свайпа
  
  useEffect(() => {
    loadEvents()
  }, [])
  
  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await api.getUserEvents()
      
      const upcomingEvents = (data.events || [])
        .filter(e => e.event_date)
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      
      setEvents(upcomingEvents)
      
      if (upcomingEvents.length > 0) {
        const statuses = {}
        for (const event of upcomingEvents.slice(0, 5)) {
          try {
            const statusData = await api.getAttendeeStatus(event.room_id, event.id)
            statuses[event.id] = statusData.status
          } catch (err) {
            statuses[event.id] = null
          }
        }
        setUserStatuses(statuses)
      }
    } catch (err) {
      console.error('Ошибка загрузки событий:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAttend = async (event, status) => {
    if (!event) return
    
    setActionLoading(true)
    try {
      await api.attendEvent(event.room_id, event.id, status)
      setUserStatuses(prev => ({ ...prev, [event.id]: status }))
      
      setEvents(prev => prev.map(e => 
        e.id === event.id 
          ? { ...e, going_count: (e.going_count || 0) + (status === 'going' ? 1 : 0) }
          : e
      ))
      
      if (onAttend) onAttend()
    } catch (err) {
      console.error('Ошибка отметки участия:', err)
    } finally {
      setActionLoading(false)
    }
  }
  
  const nextSlide = () => {
    if (events.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }
  }
  
  const prevSlide = () => {
    if (events.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)
    }
  }
  
  // Обработчики свайпов
  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsSwiping(true)
  }
  
  const onTouchMove = (e) => {
    if (!isSwiping) return
    
    const currentX = e.targetTouches[0].clientX
    setTouchEnd(currentX)
    
    if (touchStart) {
      const diff = currentX - touchStart
      // Ограничиваем смещение для плавности
      const maxOffset = 100
      const offset = Math.max(-maxOffset, Math.min(maxOffset, diff))
      setSwipeOffset(offset)
    }
  }
  
  const onTouchEnd = () => {
    setIsSwiping(false)
    
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0)
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
    
    // Сбрасываем смещение с анимацией
    setSwipeOffset(0)
    setTouchStart(null)
    setTouchEnd(null)
  }
  
  const currentEvent = events[currentIndex]
  const userStatus = currentEvent ? userStatuses[currentEvent.id] : null
  
  const renderDots = () => {
    if (events.length <= 1) return null
    
    return (
      <div className="flex justify-center gap-1.5 mt-3">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? `w-6 ${darkMode ? 'bg-[#a78bfa]' : 'bg-[#8b5cf6]'}`
                : `w-1.5 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`
            }`}
          />
        ))}
      </div>
    )
  }
  
  // Стиль для анимации свайпа
  const sliderStyle = {
    transform: `translateX(${-currentIndex * 100}%)`,
    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
  }
  
  const contentStyle = {
    transform: `translateX(${swipeOffset}px)`,
    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
  }
  
  if (loading) {
    return (
      <div className={`mx-4 mb-4 p-4 rounded-2xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }
  
  if (events.length === 0) {
    return (
      <div className={`mx-4 mb-4 p-4 rounded-2xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
        <div className="text-center py-4">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Нет запланированных событий
          </p>
          <Link 
            to="/rooms" 
            className={`inline-block text-sm mt-3 ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}
          >
            Создать событие →
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`mx-4 mb-4 rounded-2xl overflow-hidden ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
      {/* Заголовок слайдера */}
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            📅 Ближайшие события
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentIndex + 1} / {events.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={prevSlide}
                disabled={events.length <= 1}
                className={`p-1 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'
                } ${events.length <= 1 ? 'opacity-50' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                disabled={events.length <= 1}
                className={`p-1 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'
                } ${events.length <= 1 ? 'opacity-50' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Контент с поддержкой свайпов */}
      <div 
        ref={sliderRef}
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="p-4"
          style={contentStyle}
        >
          <div className="flex items-start gap-2 mb-3">
            <span className="text-xl">📅</span>
            <div className="flex-1">
              <Link to={`/room/${currentEvent.room_id}/event/${currentEvent.id}`}>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentEvent.name}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentEvent.room_name}
                </p>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-7 mb-3">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              ⏰ {formatEventDate(currentEvent.event_date)}
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              👥 {currentEvent.going_count || 0} идут
            </span>
          </div>
          
          {currentEvent.time_voting_enabled && (
            <div className={`ml-7 mb-3 text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              🗳️ Время выбирается голосованием
            </div>
          )}
          
          <div className="flex gap-2 ml-7">
            <button
              onClick={() => handleAttend(currentEvent, 'going')}
              disabled={actionLoading}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-colors ${
                userStatus === 'going'
                  ? darkMode 
                    ? 'bg-green-900/30 text-green-400 border border-green-700' 
                    : 'bg-green-100 text-green-700 border border-green-300'
                  : darkMode
                    ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46] border border-[#3f3f46]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {userStatus === 'going' ? '✓ Иду' : 'Я иду'}
            </button>
            <button
              onClick={() => handleAttend(currentEvent, 'maybe')}
              disabled={actionLoading}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-colors ${
                userStatus === 'maybe'
                  ? darkMode 
                    ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' 
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  : darkMode
                    ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46] border border-[#3f3f46]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Возможно
            </button>
            <Link
              to={`/room/${currentEvent.room_id}/event/${currentEvent.id}`}
              className={`py-2 px-3 text-sm font-medium rounded-xl ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}
            >
              Подробнее
            </Link>
          </div>
          
          {renderDots()}
        </div>
      </div>
    </div>
  )
}