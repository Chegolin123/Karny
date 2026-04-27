import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../components/common/ThemeProvider'
import { useHome } from '../hooks/useHome'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import PullToRefresh from '../components/common/PullToRefresh'
import { getAvatarColor } from '../utils/avatar'
import * as api from '../api'

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'только что'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function ChatRow({ room, darkMode }) {
  const [lastMessage, setLastMessage] = useState(null)
  const [imgError, setImgError] = useState(false)
  
  useEffect(() => {
    api.getMessages(room.id, 1).then(data => {
      if (data.messages?.length > 0) {
        setLastMessage(data.messages[0])
      }
    }).catch(() => {})
  }, [room.id])
  
  const senderName = lastMessage?.user?.first_name || ''
  const messageText = lastMessage?.content || ''
  const preview = messageText 
    ? (senderName ? `${senderName}: ${messageText}` : messageText)
    : 'Нет сообщений'
  
  useEffect(() => { setImgError(false) }, [room.photo_url])

  const lastTime = room.last_message_time || lastMessage?.created_at
  
  return (
    <Link
      to={`/room/${room.id}/chat`}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ripple ${
        darkMode ? 'active:bg-white/5' : 'active:bg-black/5'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {room.photo_url && !imgError ? (
        <img src={room.photo_url} alt={room.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 shadow-sm" onError={() => setImgError(true)} />
      ) : (
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-sm" style={{ backgroundColor: getAvatarColor(room.name) }}>
          {room.name.charAt(0).toUpperCase()}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room.name}</h3>
          {lastTime && (
            <span className={`text-xs flex-shrink-0 ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatTime(lastTime)}</span>
          )}
        </div>
        <div className="mt-0.5">
          <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{preview}</p>
        </div>
      </div>
    </Link>
  )
}

export default function ChatsPage() {
  const { rooms, loading, error, loadData } = useHome()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)
  
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }
  
  // Сортировка по last_message_time (новые сверху), затем по алфавиту
  const sortedRooms = useMemo(() => {
    if (!rooms) return []
    return [...rooms].sort((a, b) => {
      const timeA = new Date(a.last_message_time || 0).getTime()
      const timeB = new Date(b.last_message_time || 0).getTime()
      if (timeB !== timeA) return timeB - timeA
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [rooms])
  
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return sortedRooms
    const query = searchQuery.toLowerCase().trim()
    return sortedRooms.filter(room => room.name.toLowerCase().includes(query))
  }, [sortedRooms, searchQuery])
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  
  const searchBgColor = darkMode ? '#1c1c20' : '#f5f5f5'
  
  return (
    <div className={`h-full overflow-hidden flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className={`flex-shrink-0 px-4 pt-2 pb-2 ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`}>
        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Чаты</h1>
      </header>
      
      <div className={`px-4 py-2 ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`}>
        <div className="relative">
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск"
            className={`w-full px-4 py-2.5 pl-9 rounded-xl text-base focus:outline-none transition-colors`}
            style={{ backgroundColor: searchBgColor, color: darkMode ? '#fff' : '#000', WebkitAppearance: 'none' }}
            enterKeyHint="search" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full active:bg-black/10 ripple" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
          <div ref={containerRef} className="h-full overflow-y-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
            {filteredRooms.length === 0 ? (
              <EmptyState icon="💬" title={searchQuery ? 'Ничего не найдено' : 'Нет чатов'} description={searchQuery ? 'Попробуйте другой запрос' : 'Вступите в комнату чтобы начать общение'} actionText="Найти комнату" onAction={() => window.location.href = '/rooms'} darkMode={darkMode} />
            ) : (
              <div className="pb-6">
                {filteredRooms.map((room) => (
                  <ChatRow key={room.id} room={room} darkMode={darkMode} />
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  )
}
