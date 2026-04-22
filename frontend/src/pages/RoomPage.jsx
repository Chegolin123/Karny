// C:\OSPanel\domains\karny\frontend\src\pages\RoomPage.jsx

import { useState, useEffect, useRef } from 'react'
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
import RoomSettingsModal from '../components/room/RoomSettingsModal'

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
    isMember,
    updateRoom,
    createEvent,
    attendEvent,
    leaveRoom,
    deleteRoom,
    loadRoomData,
    joinPublicRoom
  } = useRoom(id)

  const { theme } = useTheme()
  const darkMode = theme === 'dark'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const wsRef = useRef(null)
  const currentUserId = api.getCurrentUserId()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/chat?roomId=${id}&userId=${currentUserId}`)
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'event_time_selected') {
          loadRoomData()
        }
      } catch (error) {
        console.error('Ошибка WebSocket:', error)
      }
    }
    
    wsRef.current = ws
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [id, currentUserId])

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
      setShowSettingsModal(false)
      showNotification('Комната обновлена')
      await loadRoomData()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateEvent = async (name, eventDate, description, timeVotingEnabled) => {
    setActionLoading(true)
    try {
      await api.createEvent(id, name, eventDate, description, timeVotingEnabled)
      setShowCreateModal(false)
      showNotification('Событие создано')
      await loadRoomData()
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
      await loadRoomData()
      showNotification(status === 'going' ? 'Вы идёте' : status === 'maybe' ? 'Возможно пойдёте' : 'Вы не идёте')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
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
    setActionLoading(true)
    try {
      await deleteRoom()
      setShowSettingsModal(false)
      window.location.href = '/'
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTransferOwnership = async (newOwnerId) => {
    setActionLoading(true)
    try {
      await api.transferRoomOwnership(id, newOwnerId)
      setShowSettingsModal(false)
      showNotification('Права переданы')
      await loadRoomData()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinPublicRoom = async () => {
    setActionLoading(true)
    try {
      await joinPublicRoom()
      showNotification('Вы вступили в комнату!')
    } catch (err) {
      if (err.message && (err.message.includes('Требуется пароль') || err.message.includes('приватная'))) {
        const password = prompt('Введите пароль для входа в комнату:')
        if (password) {
          try {
            await joinPublicRoom(password)
            showNotification('Вы вступили в комнату!')
          } catch (err2) {
            alert(err2.message)
          }
        }
      } else {
        alert(err.message || 'Ошибка вступления в комнату')
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className={`h-screen w-full max-w-full overflow-hidden relative flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <Toast message={toastMessage} show={showToast} darkMode={darkMode} />

      <RoomHeader
        room={room}
        membersCount={members.length}
        copied={copied}
        onCopyCode={handleCopyCode}
        onShare={handleShare}
        isOwner={isOwner}
        onEditRoom={() => setShowEditRoomModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        roomId={id}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
          <main className="w-full max-w-2xl mx-auto px-4 sm:px-5 py-4 sm:py-6 overflow-y-auto h-full">
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
                onAttend={handleAttend}
                actionLoading={actionLoading}
                onCreateClick={() => setShowCreateModal(true)}
                darkMode={darkMode}
                roomId={id}
              />
            )}

            {isMember && (
              <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'} space-y-3`}>
                {!isOwner && (
                  <button
                    onClick={handleLeaveRoom}
                    className="text-sm sm:text-base text-red-500 hover:text-red-600 transition-colors"
                    disabled={actionLoading}
                  >
                    Покинуть комнату
                  </button>
                )}
              </div>
            )}
          </main>
        </PullToRefresh>
      </div>

      {!isMember && (
        <div className="sticky bottom-4 mx-4 z-30">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleJoinPublicRoom}
              disabled={actionLoading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white shadow-lg ${
                darkMode
                  ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6]'
                  : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'
              }`}
            >
              {actionLoading ? 'Вступление...' : '✨ Вступить в комнату'}
            </button>
          </div>
        </div>
      )}

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

      <RoomSettingsModal
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        room={room}
        members={members}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onUpdateRoom={handleUpdateRoom}
        onTransferOwnership={handleTransferOwnership}
        onDeleteRoom={handleDeleteRoom}
        loading={actionLoading}
        darkMode={darkMode}
      />
    </div>
  )
}