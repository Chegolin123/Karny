// C:\OSPanel\domains\karny\frontend\src\pages\RoomPage.jsx

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { useTheme } from '../components/common/ThemeProvider'
import { copyToClipboard } from '../utils/clipboard'
import * as api from '../api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import Toast from '../components/common/Toast'
import EmptyState from '../components/common/EmptyState'
import PullToRefresh from '../components/common/PullToRefresh'
import RoomHeader from '../components/room/RoomHeader'
import MembersList from '../components/room/MembersList'
import EventsList from '../components/room/EventsList'
import CreateEventModal from '../components/room/CreateEventModal'
import EditRoomModal from '../components/room/EditRoomModal'
import EditEventModal from '../components/room/EditEventModal'
import AttendeesModal from '../components/room/AttendeesModal'

export default function RoomPage() {
  const { id } = useParams()
  const {
    room,
    members,
    events,
    loading,
    error,
    userAttendances,
    isOwner,
    updateRoom,
    createEvent,
    updateEvent,
    attendEvent,
    deleteEvent,
    leaveRoom,
    deleteRoom,
    canEditEvent,
    canDeleteEvent,
    canRemindEvent,
    loadRoomData
  } = useRoom(id)

  const { theme } = useTheme()
  const darkMode = theme === 'dark'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [showAttendeesModal, setShowAttendeesModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState(null)
  const [attendeesFilter, setAttendeesFilter] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const showNotification = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRoomData()
    setRefreshing(false)
  }

  const handleCopyCode = async () => {
    await copyToClipboard(room?.code)
    setCopied(true)
    showNotification('Код скопирован')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const inviteText = `Присоединяйся к комнате «${room?.name}» в Karny!\n\nКод: ${room?.code}`
    await copyToClipboard(inviteText)
    showNotification('Приглашение скопировано')
  }

  const handleUpdateRoom = async (name) => {
    setActionLoading(true)
    try {
      await updateRoom(name)
      setShowEditRoomModal(false)
      showNotification('Комната обновлена')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateEvent = async (name, eventDate, description) => {
    setActionLoading(true)
    try {
      await createEvent(name, eventDate, description)
      setShowCreateModal(false)
      showNotification('Событие создано')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditEvent = (event) => {
    setSelectedEvent(event)
    setShowEditEventModal(true)
  }

  const handleUpdateEvent = async (name, eventDate, description) => {
    setActionLoading(true)
    try {
      await updateEvent(selectedEvent.id, name, eventDate, description)
      setShowEditEventModal(false)
      setSelectedEvent(null)
      showNotification('Событие обновлено')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAttend = async (eventId, status) => {
    setActionLoading(true)
    try {
      await attendEvent(eventId, status)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    setActionLoading(true)
    try {
      await deleteEvent(eventId)
      showNotification('Событие удалено')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemind = async (eventId) => {
    setActionLoading(true)
    try {
      const result = await api.sendReminder(id, eventId)
      showNotification(`Напоминания отправлены (${result.sentCount}/${result.totalMembers})`)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleShowAttendees = (eventId, eventName, filter = null) => {
    setSelectedEventForAttendees({ id: eventId, name: eventName })
    setAttendeesFilter(filter)
    setShowAttendeesModal(true)
  }

  const handleLeaveRoom = async () => {
    if (!confirm('Вы уверены, что хотите покинуть комнату?')) return
    
    setActionLoading(true)
    try {
      await leaveRoom()
      window.location.href = '/'
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!confirm('Вы уверены, что хотите удалить комнату? Это действие нельзя отменить.')) return
    
    setActionLoading(true)
    try {
      await deleteRoom()
      window.location.href = '/'
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className={`min-h-screen relative ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <Toast message={toastMessage} show={showToast} darkMode={darkMode} />

      <RoomHeader
        room={room}
        membersCount={members.length}
        copied={copied}
        onCopyCode={handleCopyCode}
        onShare={handleShare}
        isOwner={isOwner}
        onEditRoom={() => setShowEditRoomModal(true)}
        roomId={id}
      />

      <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
        <main className="max-w-2xl mx-auto px-5 py-6">
          <MembersList members={members} ownerId={room?.owner_id} darkMode={darkMode} />

          {events.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Нет событий"
              description="Создайте первое событие в этой комнате"
              actionText="Создать событие"
              onAction={() => setShowCreateModal(true)}
              darkMode={darkMode}
            />
          ) : (
            <EventsList
              events={events}
              userAttendances={userAttendances}
              canEditEvent={canEditEvent}
              canDeleteEvent={canDeleteEvent}
              canRemindEvent={canRemindEvent}
              onAttend={handleAttend}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onRemind={handleRemind}
              onShowAttendees={handleShowAttendees}
              actionLoading={actionLoading}
              onCreateClick={() => setShowCreateModal(true)}
              darkMode={darkMode}
            />
          )}

          <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'} space-y-3`}>
            {!isOwner && (
              <button
                onClick={handleLeaveRoom}
                className="text-sm text-red-500 hover:text-red-600 transition-colors"
                disabled={actionLoading}
              >
                Покинуть комнату
              </button>
            )}
            
            {isOwner && (
              <button
                onClick={handleDeleteRoom}
                className="text-sm text-red-500 hover:text-red-600 transition-colors"
                disabled={actionLoading}
              >
                Удалить комнату
              </button>
            )}
          </div>
        </main>
      </PullToRefresh>

      <CreateEventModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateEvent}
        loading={actionLoading}
        darkMode={darkMode}
      />

      <EditRoomModal
        show={showEditRoomModal}
        onClose={() => setShowEditRoomModal(false)}
        onSubmit={handleUpdateRoom}
        room={room}
        loading={actionLoading}
        darkMode={darkMode}
      />

      <EditEventModal
        show={showEditEventModal}
        onClose={() => {
          setShowEditEventModal(false)
          setSelectedEvent(null)
        }}
        onSubmit={handleUpdateEvent}
        event={selectedEvent}
        loading={actionLoading}
        darkMode={darkMode}
      />

      <AttendeesModal
        show={showAttendeesModal}
        onClose={() => {
          setShowAttendeesModal(false)
          setSelectedEventForAttendees(null)
          setAttendeesFilter(null)
        }}
        roomId={id}
        eventId={selectedEventForAttendees?.id}
        eventName={selectedEventForAttendees?.name}
        filterStatus={attendeesFilter}
        darkMode={darkMode}
      />
    </div>
  )
}