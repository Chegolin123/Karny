// C:\OSPanel\domains\karny\frontend\src\pages\EventPage.jsx

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../components/common/ThemeProvider'
import * as api from '../api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import Toast from '../components/common/Toast'
import MemberAvatar from '../components/room/MemberAvatar'
import TimeVoting from '../components/room/TimeVoting'
import EditEventModal from '../components/room/EditEventModal'
import AttendeesModal from '../components/room/AttendeesModal'

// Форматирование даты
function formatEventDate(dateStr) {
  if (!dateStr) return 'Время обсуждается'
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function EventPage() {
  const { roomId, eventId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  const [event, setEvent] = useState(null)
  const [room, setRoom] = useState(null)
  const [attendees, setAttendees] = useState({ going: [], maybe: [], declined: [] })
  const [userStatus, setUserStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Модальные окна
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAttendeesModal, setShowAttendeesModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  const currentUserId = api.getCurrentUserId()
  const isOwner = room?.owner_id == currentUserId
  const isCreator = event?.created_by == currentUserId
  const canEdit = isOwner || isCreator

  useEffect(() => {
    loadData()
  }, [roomId, eventId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Загружаем данные комнаты
      const roomData = await api.getRoom(roomId)
      setRoom(roomData.room)
      
      // Находим событие
      const eventData = roomData.events.find(e => e.id == eventId)
      if (!eventData) {
        setError('Событие не найдено')
        return
      }
      setEvent(eventData)
      
      // Загружаем участников события
      const attendeesData = await api.getEventAttendees(roomId, eventId)
      setAttendees(attendeesData)
      
      // Загружаем статус текущего пользователя
      const statusData = await api.getAttendeeStatus(roomId, eventId)
      setUserStatus(statusData.status)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleAttend = async (status) => {
    setActionLoading(true)
    try {
      await api.attendEvent(roomId, eventId, status)
      setUserStatus(status)
      await loadData()
      showNotification(status === 'going' ? 'Вы идёте' : status === 'maybe' ? 'Возможно пойдёте' : 'Вы не идёте')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateEvent = async (name, eventDate, description, timeVotingEnabled) => {
    setActionLoading(true)
    try {
      await api.updateEvent(roomId, eventId, name, eventDate, description, timeVotingEnabled)
      setShowEditModal(false)
      showNotification('Событие обновлено')
      await loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirm('Удалить событие? Это действие нельзя отменить.')) return
    
    setActionLoading(true)
    try {
      await api.deleteEvent(roomId, eventId)
      navigate(`/room/${roomId}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemind = async () => {
    setActionLoading(true)
    try {
      const result = await api.sendReminder(roomId, eventId)
      showNotification(`Напоминания отправлены (${result.sentCount}/${result.totalMembers})`)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusButtonStyle = (status) => {
    const isActive = userStatus === status
    const baseStyle = 'flex-1 py-3 px-4 text-sm font-semibold border-2 rounded-xl transition-all duration-200'
    
    if (isActive) {
      const activeStyles = {
        going: darkMode 
          ? 'bg-green-900/30 border-green-600 text-green-400' 
          : 'bg-green-100 border-green-500 text-green-800',
        maybe: darkMode 
          ? 'bg-yellow-900/30 border-yellow-600 text-yellow-400' 
          : 'bg-yellow-100 border-yellow-500 text-yellow-800',
        declined: darkMode 
          ? 'bg-red-900/30 border-red-600 text-red-400' 
          : 'bg-red-100 border-red-500 text-red-800'
      }
      return `${baseStyle} ${activeStyles[status]}`
    }
    
    const styles = {
      going: darkMode 
        ? 'border-green-800 text-green-500 hover:bg-green-900/20' 
        : 'border-green-300 text-green-700 hover:bg-green-50',
      maybe: darkMode 
        ? 'border-yellow-800 text-yellow-500 hover:bg-yellow-900/20' 
        : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50',
      declined: darkMode 
        ? 'border-red-800 text-red-500 hover:bg-red-900/20' 
        : 'border-red-300 text-red-700 hover:bg-red-50'
    }
    return `${baseStyle} ${styles[status]} ${actionLoading ? 'opacity-50' : ''}`
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className={`h-screen w-full max-w-full overflow-hidden relative flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <Toast message={toastMessage} show={showToast} darkMode={darkMode} />
      
      {/* Шапка - фиксированная */}
      <header className={`flex-shrink-0 ${darkMode ? 'bg-[#1a1a1e] border-b border-[#2a2a30]' : 'bg-white border-b border-gray-200'}`}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link 
              to={`/room/${roomId}`}
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
                {event?.name}
              </h1>
              <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {room?.name}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                  darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Контент - скроллится */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <main className="max-w-2xl mx-auto px-4 py-4">
          {/* Описание */}
          {event?.description && (
            <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
              <h2 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Описание
              </h2>
              <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {event.description}
              </p>
            </div>
          )}
          
          {/* Дата и время */}
          <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
            <h2 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {event?.time_voting_enabled ? 'Голосование за время' : 'Дата и время'}
            </h2>
            {event?.time_voting_enabled ? (
              <p className={`text-base ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                🗳️ Время выбирается голосованием
              </p>
            ) : (
              <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatEventDate(event?.event_date)}
              </p>
            )}
          </div>
          
          {/* Голосование за время */}
          {event?.time_voting_enabled && (
            <div className="mb-6">
              <TimeVoting 
                roomId={roomId} 
                event={event} 
                darkMode={darkMode}
                isOwner={isOwner}
                canEdit={canEdit}
              />
            </div>
          )}
          
          {/* Участники */}
          <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Участники
              </h2>
              <button
                onClick={() => setShowAttendeesModal(true)}
                className={`text-sm ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}
              >
                Все
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {attendees.going.length}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Идут</span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {attendees.maybe.length}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Возможно</span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {attendees.declined.length}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Не идут</span>
              </div>
            </div>
            
            {/* Аватарки первых 5 участников */}
            {attendees.going.length > 0 && (
              <div className="flex items-center mt-4">
                <div className="flex -space-x-2">
                  {attendees.going.slice(0, 5).map(user => (
                    <MemberAvatar key={user.id} member={user} size="sm" />
                  ))}
                </div>
                {attendees.going.length > 5 && (
                  <span className={`ml-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    +{attendees.going.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Кнопки действий */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => handleAttend('going')}
              className={getStatusButtonStyle('going')}
              disabled={actionLoading}
            >
              {userStatus === 'going' ? '✓ Иду' : 'Иду'}
            </button>
            <button
              onClick={() => handleAttend('maybe')}
              className={getStatusButtonStyle('maybe')}
              disabled={actionLoading}
            >
              {userStatus === 'maybe' ? '✓ Возможно' : 'Возможно'}
            </button>
            <button
              onClick={() => handleAttend('declined')}
              className={getStatusButtonStyle('declined')}
              disabled={actionLoading}
            >
              {userStatus === 'declined' ? '✓ Не иду' : 'Не иду'}
            </button>
          </div>
          
          {/* Кнопки управления */}
          {canEdit && (
            <div className="space-y-2">
              <button
                onClick={handleRemind}
                disabled={actionLoading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                  darkMode 
                    ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46] border border-[#3f3f46]' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                🔔 Напомнить участникам
              </button>
              
              <button
                onClick={handleDeleteEvent}
                disabled={actionLoading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                  darkMode 
                    ? 'text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20' 
                    : 'text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50'
                }`}
              >
                🗑️ Удалить событие
              </button>
            </div>
          )}
        </main>
      </div>
      
      {/* Модальные окна */}
      <EditEventModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateEvent}
        event={event}
        loading={actionLoading}
        darkMode={darkMode}
      />
      
      <AttendeesModal
        show={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
        roomId={roomId}
        eventId={eventId}
        eventName={event?.name}
        darkMode={darkMode}
      />
    </div>
  )
}