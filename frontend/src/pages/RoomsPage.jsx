import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useHome } from '../hooks/useHome'
import { useTheme } from '../components/common/ThemeProvider'
import { useNotification } from '../contexts/NotificationContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import PullToRefresh from '../components/common/PullToRefresh'
import RoomsList from '../components/home/RoomsList'
import CreateRoomModal from '../components/home/CreateRoomModal'
import JoinRoomModal from '../components/home/JoinRoomModal'
import * as api from '../api'

const SORT_OPTIONS = [
  { value: 'default', label: 'По умолчанию', icon: '📋' },
  { value: 'members', label: 'По участникам', icon: '👥' },
  { value: 'activity', label: 'По активности', icon: '💬' },
  { value: 'events', label: 'По событиям', icon: '📅' },
  { value: 'name', label: 'По алфавиту', icon: '🔤' }
];

export default function RoomsPage() {
  const { user, rooms, loading, error, createRoom, joinRoom, loadData } = useHome()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  const { notifySuccess, notifyError } = useNotification()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [publicRooms, setPublicRooms] = useState([])
  const [publicRoomsLoading, setPublicRoomsLoading] = useState(false)
  const [showPublicRooms, setShowPublicRooms] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [showBurgerMenu, setShowBurgerMenu] = useState(false)
  
  const [overscroll, setOverscroll] = useState(0)
  const [isOverscrolling, setIsOverscrolling] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef(null)
  const maxOverscroll = 120
  const burgerMenuRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (burgerMenuRef.current && !burgerMenuRef.current.contains(e.target)) {
        setShowBurgerMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const loadPublicRooms = useCallback(async (showLoading = false) => {
    if (showLoading) setPublicRoomsLoading(true)
    try {
      const data = await api.getPublicRooms()
      setPublicRooms(data.rooms || [])
    } catch (err) {
      console.error('Ошибка загрузки публичных комнат:', err)
      notifyError('Не удалось загрузить публичные комнаты')
    } finally {
      if (showLoading) setPublicRoomsLoading(false)
    }
  }, [notifyError])
  
  useEffect(() => { loadPublicRooms(false) }, [])
  
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    if (showPublicRooms) await loadPublicRooms(false)
    setRefreshing(false)
  }
  
  const handleCreateRoom = async (name, isPrivate, password) => {
    setActionLoading(true)
    try {
      await createRoom(name, isPrivate, password)
      setShowCreateModal(false)
      notifySuccess(`Комната «${name}» создана!`)
    } catch (err) { notifyError(err.message) }
    finally { setActionLoading(false) }
  }
  
  const handleJoinRoom = async (code, password) => {
    setActionLoading(true)
    try {
      const result = await joinRoom(code, password)
      setShowJoinModal(false)
      notifySuccess(result.message || 'Вы присоединились к комнате!')
      await loadData()
      if (showPublicRooms) await loadPublicRooms(false)
    } catch (err) { notifyError(err.message); throw err }
    finally { setActionLoading(false) }
  }
  
  const handleJoinPublicRoom = async (room) => {
    setActionLoading(true)
    try {
      await joinRoom(room.code)
      notifySuccess(`Вы вступили в комнату «${room.name}»!`)
      await loadData()
      await loadPublicRooms(false)
    } catch (err) {
      if (err.message.includes('Требуется пароль') || err.message.includes('приватная')) {
        const password = prompt('Введите пароль для входа в комнату:')
        if (password) {
          try {
            await joinRoom(room.code, password)
            notifySuccess(`Вы вступили в комнату «${room.name}»!`)
            await loadData()
            await loadPublicRooms(false)
          } catch (err2) { notifyError(err2.message) }
        }
      } else { notifyError(err.message) }
    }
    finally { setActionLoading(false) }
  }
  
  const handleTogglePublicRooms = useCallback(async () => {
    if (!showPublicRooms) { setShowPublicRooms(true); loadPublicRooms(false) }
    else { setShowPublicRooms(false); setSearchQuery('') }
  }, [showPublicRooms, loadPublicRooms])
  
  const handleTouchStart = useCallback((e) => {
    const container = containerRef.current
    if (!container) return
    if (container.scrollTop <= 0 || container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
      touchStartY.current = e.touches[0].clientY
      setIsOverscrolling(true)
    }
  }, [])
  
  const handleTouchMove = useCallback((e) => {
    if (!isOverscrolling) return
    const container = containerRef.current
    if (!container) return
    const isAtTop = container.scrollTop <= 0
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1
    if (!isAtTop && !isAtBottom) { setIsOverscrolling(false); setOverscroll(0); return }
    const diff = e.touches[0].clientY - touchStartY.current
    if ((isAtTop && diff > 0) || (isAtBottom && diff < 0)) {
      e.preventDefault()
      setOverscroll(isAtTop ? Math.min(diff * 0.35, maxOverscroll) : -Math.min(Math.abs(diff) * 0.35, maxOverscroll))
    } else { setOverscroll(0) }
  }, [isOverscrolling])
  
  const handleTouchEnd = useCallback(() => { setIsOverscrolling(false); setOverscroll(0) }, [])
  
  const displayRooms = showPublicRooms ? publicRooms : (rooms || [])
  
  const filteredRooms = useMemo(() => {
    let result = [...displayRooms]
    switch (sortBy) {
      case 'members': result.sort((a, b) => (b.members_count || 0) - (a.members_count || 0)); break
      case 'activity': result.sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)); break
      case 'events': result.sort((a, b) => (b.upcoming_events_count || 0) - (a.upcoming_events_count || 0)); break
      case 'name': result.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(room => room.name.toLowerCase().includes(query) || room.code.toLowerCase().includes(query))
    }
    return result
  }, [displayRooms, searchQuery, sortBy])
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <div className={`h-full overflow-hidden flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <header className={`flex-shrink-0 ${darkMode ? 'bg-[#1a1a1e] border-b border-[#2a2a30]' : 'bg-white border-b border-gray-200'}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showPublicRooms && (
                <button onClick={handleTogglePublicRooms} className={`p-2 -ml-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{showPublicRooms ? 'Публичные комнаты' : 'Мои комнаты'}</h1>
            </div>
            <div className="flex items-center gap-2">
              {!showPublicRooms && (
                <button onClick={handleTogglePublicRooms} className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${darkMode ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>🌍 Публичные</button>
              )}
              <button onClick={() => setShowCreateModal(true)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title="Создать комнату">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
              <button onClick={() => setShowJoinModal(true)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title="Присоединиться">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </button>
              <div className="relative" ref={burgerMenuRef}>
                <button onClick={() => setShowBurgerMenu(!showBurgerMenu)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title="Сортировка">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>
                {showBurgerMenu && (
                  <div className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-[#1a1a1e] border-[#2a2a30]' : 'bg-white border-gray-200'}`}>
                    <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-100'}`}>
                      <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Сортировка комнат</h3>
                    </div>
                    <div className="py-2">
                      {SORT_OPTIONS.map(option => (
                        <button key={option.value} onClick={() => { setSortBy(option.value); setShowBurgerMenu(false); }}
                          className={`w-full px-4 py-3 text-sm text-left transition-colors flex items-center gap-3 ${sortBy === option.value ? (darkMode ? 'bg-[#2d1b4e] text-[#c4b5fd]' : 'bg-[#f5f3ff] text-[#6d28d9]') : (darkMode ? 'text-gray-300 hover:bg-[#2a2a30]' : 'text-gray-700 hover:bg-gray-50')}`}>
                          <span className="text-lg">{option.icon}</span>
                          <span className="flex-1">{option.label}</span>
                          {sortBy === option.value && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="px-4 py-3">
        <div className="relative">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по названию или коду..."
            className={`w-full px-4 py-2.5 pl-10 border rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`} />
          <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? 'hover:bg-[#3f3f46]' : 'hover:bg-gray-100'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        {searchQuery && <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Найдено: {filteredRooms.length}</p>}
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
          <div ref={containerRef} className="h-full overflow-y-auto overscroll-contain scrollbar-hide" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div className="px-4 pb-4" style={{ transform: `translateY(${overscroll}px)`, transition: isOverscrolling ? 'none' : 'transform 0.2s ease-out' }}>
              {filteredRooms.length === 0 ? (
                <EmptyState icon={searchQuery ? '🔍' : (showPublicRooms ? '🌍' : '🏠')} title={searchQuery ? 'Ничего не найдено' : (showPublicRooms ? 'Нет публичных комнат' : 'Нет комнат')} description={searchQuery ? 'Попробуйте изменить поисковый запрос' : (showPublicRooms ? 'Здесь будут отображаться публичные комнаты других пользователей' : 'Создайте новую комнату или присоединитесь по коду')} actionText={searchQuery ? null : (showPublicRooms ? null : 'Создать комнату')} onAction={searchQuery ? null : (() => setShowCreateModal(true))} darkMode={darkMode} />
              ) : (
                <RoomsList rooms={filteredRooms} darkMode={darkMode} showJoinButton={showPublicRooms} onJoin={handleJoinPublicRoom} />
              )}
            </div>
          </div>
        </PullToRefresh>
      </div>
      
      <CreateRoomModal show={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateRoom} loading={actionLoading} darkMode={darkMode} />
      <JoinRoomModal show={showJoinModal} onClose={() => setShowJoinModal(false)} onSubmit={handleJoinRoom} loading={actionLoading} darkMode={darkMode} />
    </div>
  )
}
