import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
import PollModal from '../components/room/chat/PollModal'
import RoomPolls from '../components/room/RoomPolls'
import FundingCard from '../components/room/FundingCard'
import CreateFundingModal from '../components/room/CreateFundingModal'

const tabs = [
  { path: '/', icon: '🏠', label: 'Главная' },
  { path: '/rooms', icon: '🏢', label: 'Комнаты' },
  { path: '/chats', icon: '💬', label: 'Чаты' },
  { path: '/profile', icon: '👤', label: 'Профиль' },
]

export default function RoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    room, members, events, loading, error, userAttendances,
    isOwner, isMember, updateRoom, attendEvent,
    leaveRoom, deleteRoom, loadRoomData, joinPublicRoom
  } = useRoom(id)

  const { theme } = useTheme()
  const darkMode = theme === 'dark'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showPollModal, setShowPollModal] = useState(false)
  const [showFundingModal, setShowFundingModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [polls, setPolls] = useState([])
  const [pollsLoading, setPollsLoading] = useState(false)
  const [fundings, setFundings] = useState([])

  const wsRef = useRef(null)
  const currentUserId = api.getCurrentUserId()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/chat?roomId=${id}&userId=${currentUserId}`)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'event_time_selected') loadRoomData()
        if (data.type === "room_updated") { loadRoomData(); showNotification("Комната обновлена"); }
        if (data.type === 'poll_created' || data.type === 'poll_updated') loadPolls()
      } catch (error) { console.error('Ошибка WebSocket:', error) }
    }
    wsRef.current = ws
    return () => { if (wsRef.current) wsRef.current.close() }
  }, [id, currentUserId, loadRoomData])

  const showNotification = (message) => { setToastMessage(message); setShowToast(true); setTimeout(() => setShowToast(false), 2000) }
  const handleRefresh = async () => { setRefreshing(true); await loadRoomData(); await loadPolls(); await loadFundings(); setRefreshing(false) }

  const loadPolls = async () => {
    setPollsLoading(true)
    try { const data = await api.getRoomPolls(id); setPolls(data.polls || []) }
    catch (err) { console.error('Ошибка загрузки опросов:', err) }
    finally { setPollsLoading(false) }
  }

  const loadFundings = async () => {
    try {
      const data = await api.getFundings(id)
      setFundings(data.fundings || [])
    } catch (err) {
      console.error('Ошибка загрузки сборов:', err)
    }
  }

  useEffect(() => { if (id && isMember) { loadPolls(); loadFundings() } }, [id, isMember])

  const handleCopyCode = async () => { if (!room?.code) return; await copyToClipboard(room.code); setCopied(true); showNotification('Код скопирован'); setTimeout(() => setCopied(false), 2000) }
  const handleShare = async () => { if (!room?.name || !room?.code) return; await copyToClipboard(`Присоединяйся к комнате «${room.name}» в Karny!\n\nКод: ${room.code}`); showNotification('Приглашение скопировано') }

  const handleUpdateRoom = async (name, photoUrl = null) => {
    setActionLoading(true)
    try { await updateRoom(name, photoUrl); setShowEditRoomModal(false); setShowSettingsModal(false); showNotification('Комната обновлена'); await loadRoomData() }
    catch (err) { alert(err.message) }
    finally { setActionLoading(false) }
  }

  const handleCreateEvent = async (name, eventDate, description, timeVotingEnabled, videoUrl) => {
    setActionLoading(true)
    try { await api.createEvent(id, name, eventDate, description, timeVotingEnabled, videoUrl); setShowCreateModal(false); showNotification('Событие создано'); await loadRoomData() }
    catch (err) { alert(err.message) }
    finally { setActionLoading(false) }
  }

  const handleCreatePoll = async (question, options, isAnonymous, isMultiple) => {
    setActionLoading(true)
    try { await api.createPoll(id, question, options, isAnonymous, isMultiple); setShowPollModal(false); showNotification('Опрос создан'); await loadPolls() }
    catch (err) { alert(err.message) }
    finally { setActionLoading(false) }
  }

  const handleCreateFunding = async (title, description, goal, eventId, pollId) => {
    setActionLoading(true)
    try { await api.createFunding(id, title, description, goal, eventId, pollId); setShowFundingModal(false); showNotification('Сбор создан!'); await loadFundings() }
    catch (err) { alert(err.message) }
    finally { setActionLoading(false) }
  }

  const handleVotePoll = async (pollId, optionIds) => { try { await api.votePoll(id, pollId, optionIds); await loadPolls(); showNotification('Голос учтён') } catch (err) { alert('Ошибка голосования: ' + err.message) } }
  const handleClosePoll = async (pollId) => { try { await api.closePoll(id, pollId); await loadPolls(); showNotification('Опрос закрыт') } catch (err) { alert('Ошибка закрытия опроса: ' + err.message) } }

  const handleAttend = async (eventId, status) => {
    setActionLoading(true)
    try { await attendEvent(eventId, status); await loadRoomData(); showNotification(status === 'going' ? 'Вы идёте' : status === 'maybe' ? 'Возможно пойдёте' : 'Вы не идёте') }
    catch (err) { alert(err.message) }
    finally { setActionLoading(false) }
  }

  const handleLeaveRoom = async () => { if (!confirm('Вы уверены?')) return; setActionLoading(true); try { await leaveRoom(); window.location.href = '/' } catch (err) { alert(err.message) } finally { setActionLoading(false) } }
  const handleDeleteRoom = async () => { setActionLoading(true); try { await deleteRoom(); setShowSettingsModal(false); window.location.href = '/' } catch (err) { alert(err.message) } finally { setActionLoading(false) } }
  const handleTransferOwnership = async (newOwnerId) => { setActionLoading(true); try { await api.transferRoomOwnership(id, newOwnerId); setShowSettingsModal(false); showNotification('Права переданы'); await loadRoomData() } catch (err) { alert(err.message) } finally { setActionLoading(false) } }

  const handleJoinPublicRoom = async () => {
    setActionLoading(true)
    try { await joinPublicRoom(); showNotification('Вы вступили в комнату!') }
    catch (err) {
      if (err.message && (err.message.includes('Требуется пароль') || err.message.includes('приватная'))) {
        const password = prompt('Введите пароль:')
        if (password) { try { await joinPublicRoom(password); showNotification('Вы вступили!') } catch (err2) { alert(err2.message) } }
      } else { alert(err.message || 'Ошибка вступления') }
    }
    finally { setActionLoading(false) }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!room || !members || !events) return <LoadingSpinner />

  const activePolls = polls.filter(p => !p.is_closed)
  const closedPolls = polls.filter(p => p.is_closed)

  return (
    <div className={`h-screen w-full max-w-full overflow-hidden relative flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <Toast message={toastMessage} show={showToast} darkMode={darkMode} />

      <RoomHeader room={room} membersCount={members.length} copied={copied} onCopyCode={handleCopyCode} onShare={handleShare} isOwner={isOwner} onEditRoom={() => setShowEditRoomModal(true)} onOpenSettings={() => setShowSettingsModal(true)} onPollClick={() => setShowPollModal(true)} onFundingClick={() => setShowFundingModal(true)} roomId={id} />

      <div className="flex-1 min-h-0 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
          <main className="w-full max-w-2xl mx-auto px-4 sm:px-5 py-4 sm:py-6 overflow-y-auto h-full">
            <MembersList members={members} ownerId={room?.owner_id} darkMode={darkMode} />

            {!pollsLoading && activePolls.length > 0 && (
              <RoomPolls polls={activePolls} darkMode={darkMode} isAdmin={isOwner} onVote={handleVotePoll} onClose={handleClosePoll} currentUserId={currentUserId} />
            )}

            {/* Сборы */}
            {fundings.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 px-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💰 Сборы</h3>
                <div className="space-y-3">
                  {fundings.map(f => <FundingCard key={f.id} funding={f} darkMode={darkMode} isAdmin={isOwner} onUpdate={loadFundings} />)}
                </div>
              </div>
            )}

            {events.length === 0 && activePolls.length === 0 ? (
              <EmptyState icon="📅" title="Нет событий" description="Создайте первое событие или опрос" actionText="Создать событие" onAction={() => setShowCreateModal(true)} darkMode={darkMode} />
            ) : (
              <EventsList events={events} userAttendances={userAttendances} onAttend={handleAttend} actionLoading={actionLoading} onCreateClick={() => setShowCreateModal(true)} darkMode={darkMode} roomId={id} />
            )}

            {!pollsLoading && closedPolls.length > 0 && (
              <div className="mt-6">
                <h3 className={`text-sm font-semibold mb-3 px-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>📊 Завершённые опросы</h3>
                <RoomPolls polls={closedPolls} darkMode={darkMode} isAdmin={isOwner} onVote={handleVotePoll} onClose={handleClosePoll} currentUserId={currentUserId} />
              </div>
            )}

            {isMember && (
              <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'} space-y-3`}>
                {!isOwner && (
                  <button onClick={handleLeaveRoom} className="text-sm sm:text-base text-red-500 hover:text-red-600 transition-colors" disabled={actionLoading}>Покинуть комнату</button>
                )}
              </div>
            )}
          </main>
        </PullToRefresh>
      </div>

      {!isMember && (
        <div className="sticky bottom-20 mx-4 z-30">
          <div className="max-w-2xl mx-auto">
            <button onClick={handleJoinPublicRoom} disabled={actionLoading} className={`w-full py-3 px-4 rounded-xl font-medium text-white shadow-lg ${darkMode ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'}`}>
              {actionLoading ? 'Вступление...' : '✨ Вступить в комнату'}
            </button>
          </div>
        </div>
      )}

      <nav className={`flex-shrink-0 border-t safe-area-pb ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-around">
          {tabs.map(tab => {
            const active = isActive(tab.path)
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${active ? (darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]') : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <CreateEventModal show={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateEvent} loading={actionLoading} darkMode={darkMode} />
      <EditRoomModal show={showEditRoomModal} onClose={() => setShowEditRoomModal(false)} onSubmit={handleUpdateRoom} room={room} loading={actionLoading} darkMode={darkMode} />
      <RoomSettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} room={room} members={members} currentUserId={currentUserId} isOwner={isOwner} onUpdateRoom={handleUpdateRoom} onTransferOwnership={handleTransferOwnership} onDeleteRoom={handleDeleteRoom} loading={actionLoading} darkMode={darkMode} />
      <PollModal show={showPollModal} onClose={() => setShowPollModal(false)} onSubmit={handleCreatePoll} darkMode={darkMode} />
      <CreateFundingModal show={showFundingModal} onClose={() => setShowFundingModal(false)} onSubmit={handleCreateFunding} loading={actionLoading} darkMode={darkMode} events={events} polls={polls.filter(p => !p.is_closed)} />
    </div>
  )
}
