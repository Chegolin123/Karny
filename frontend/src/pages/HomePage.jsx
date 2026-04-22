// C:\OSPanel\domains\karny\frontend\src\pages\HomePage.jsx

import { useState, useEffect, useMemo } from 'react'
import { useHome } from '../hooks/useHome'
import { useTelegram } from '../hooks/useTelegram'
import { useTheme } from '../components/common/ThemeProvider'
import { useNotification } from '../contexts/NotificationContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import PullToRefresh from '../components/common/PullToRefresh'
import HomeHeader from '../components/home/HomeHeader'
import ActionButtons from '../components/home/ActionButtons'
import RoomsList from '../components/home/RoomsList'
import CreateRoomModal from '../components/home/CreateRoomModal'
import JoinRoomModal from '../components/home/JoinRoomModal'
import AppSettingsModal from '../components/common/AppSettingsModal'
import EventCalendar from '../components/home/EventCalendar'
import * as api from '../api'

export default function HomePage() {
  const { user, rooms, loading, error, createRoom, joinRoom, loadData } = useHome()
  const { telegramUser } = useTelegram()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  const { notifySuccess, notifyError } = useNotification()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [publicRooms, setPublicRooms] = useState([])
  const [publicRoomsLoading, setPublicRoomsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('my')
  
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Загружаем публичные комнаты при первом рендере
    loadPublicRooms()
  }, [])

  const loadPublicRooms = async () => {
    setPublicRoomsLoading(true)
    try {
      const data = await api.getPublicRooms()
      setPublicRooms(data.rooms || [])
    } catch (err) {
      console.error('Ошибка загрузки публичных комнат:', err)
    } finally {
      setPublicRoomsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    await loadPublicRooms()
    setRefreshing(false)
  }

  const handleCreateRoom = async (name, isPrivate, password) => {
    setActionLoading(true)
    try {
      await createRoom(name, isPrivate, password)
      setShowCreateModal(false)
      notifySuccess(`Комната «${name}» создана!`)
      await loadPublicRooms() // Обновляем публичные комнаты
    } catch (err) {
      notifyError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinRoom = async (code, password) => {
    setActionLoading(true)
    try {
      const result = await joinRoom(code, password)
      setShowJoinModal(false)
      setActiveTab('my')
      notifySuccess(result.message || 'Вы присоединились к комнате!')
      await loadData() // Обновляем мои комнаты
      await loadPublicRooms() // Обновляем публичные
    } catch (err) {
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinPublicRoom = async (room) => {
    setActionLoading(true)
    try {
      const result = await joinRoom(room.code)
      setActiveTab('my')
      notifySuccess(`Вы вступили в комнату «${room.name}»!`)
      await loadData()
      await loadPublicRooms()
    } catch (err) {
      if (err.message.includes('Требуется пароль') || err.message.includes('приватная')) {
        const password = prompt('Введите пароль для входа в комнату:')
        if (password) {
          try {
            const result = await joinRoom(room.code, password)
            setActiveTab('my')
            notifySuccess(`Вы вступили в комнату «${room.name}»!`)
            await loadData()
            await loadPublicRooms()
          } catch (err2) {
            notifyError(err2.message)
          }
        }
      } else {
        notifyError(err.message)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const myRooms = rooms || []
  const allRooms = activeTab === 'my' ? myRooms : publicRooms
  
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return allRooms
    
    const query = searchQuery.toLowerCase().trim()
    return allRooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.code.toLowerCase().includes(query)
    )
  }, [allRooms, searchQuery])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className={`h-screen w-full max-w-full overflow-hidden relative flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <HomeHeader 
        user={user} 
        telegramUser={telegramUser} 
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenCalendar={() => setShowCalendar(true)}
      />
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
          <main className="w-full max-w-2xl mx-auto px-4 sm:px-5 py-4 sm:py-6 overflow-y-auto h-full">
            <ActionButtons 
              onCreate={() => setShowCreateModal(true)} 
              onJoin={() => setShowJoinModal(true)} 
              darkMode={darkMode}
            />
            
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или коду..."
                className={`w-full px-4 py-2.5 pl-10 border rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors ${
                  darkMode 
                    ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? 'hover:bg-[#3f3f46]' : 'hover:bg-gray-100'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setActiveTab('my')
                  setSearchQuery('')
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'my'
                    ? darkMode 
                      ? 'bg-[#2d1b4e] text-[#c4b5fd]' 
                      : 'bg-[#f5f3ff] text-[#6d28d9]'
                    : darkMode
                      ? 'bg-[#2a2a30] text-gray-400 hover:bg-[#3f3f46]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🏠 Мои ({myRooms.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('public')
                  setSearchQuery('')
                  if (publicRooms.length === 0) {
                    loadPublicRooms()
                  }
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'public'
                    ? darkMode 
                      ? 'bg-[#2d1b4e] text-[#c4b5fd]' 
                      : 'bg-[#f5f3ff] text-[#6d28d9]'
                    : darkMode
                      ? 'bg-[#2a2a30] text-gray-400 hover:bg-[#3f3f46]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🌍 Публичные ({publicRooms.length})
              </button>
            </div>
            
            {searchQuery && (
              <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Найдено: {filteredRooms.length}
              </p>
            )}
            
            {publicRoomsLoading && activeTab === 'public' ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredRooms.length === 0 ? (
              <EmptyState
                icon={searchQuery ? '🔍' : (activeTab === 'my' ? '🏠' : '🌍')}
                title={searchQuery ? 'Ничего не найдено' : (activeTab === 'my' ? 'Нет комнат' : 'Нет публичных комнат')}
                description={searchQuery 
                  ? 'Попробуйте изменить поисковый запрос' 
                  : (activeTab === 'my' 
                    ? 'Создайте новую комнату или присоединитесь по коду' 
                    : 'Здесь будут отображаться публичные комнаты других пользователей')}
                actionText={searchQuery ? null : (activeTab === 'my' ? 'Создать комнату' : 'Обновить')}
                onAction={searchQuery ? null : (() => activeTab === 'my' ? setShowCreateModal(true) : loadPublicRooms())}
                darkMode={darkMode}
              />
            ) : (
              <RoomsList 
                rooms={filteredRooms} 
                darkMode={darkMode} 
                showJoinButton={activeTab === 'public'} 
                onJoin={handleJoinPublicRoom}
              />
            )}
          </main>
        </PullToRefresh>
      </div>

      <CreateRoomModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRoom}
        loading={actionLoading}
        darkMode={darkMode}
      />

      <JoinRoomModal
        show={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinRoom}
        loading={actionLoading}
        darkMode={darkMode}
      />

      <AppSettingsModal
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCalendar(false)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <EventCalendar darkMode={darkMode} onClose={() => setShowCalendar(false)} />
          </div>
        </div>
      )}
    </div>
  )
}