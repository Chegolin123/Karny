// C:\OSPanel\domains\karny\frontend\src\pages\HomePage.jsx

import { useState } from 'react'
import { useHome } from '../hooks/useHome'
import { useTelegram } from '../hooks/useTelegram'
import { useTheme } from '../components/common/ThemeProvider'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import PullToRefresh from '../components/common/PullToRefresh'
import HomeHeader from '../components/home/HomeHeader'
import ActionButtons from '../components/home/ActionButtons'
import RoomsList from '../components/home/RoomsList'
import CreateRoomModal from '../components/home/CreateRoomModal'
import JoinRoomModal from '../components/home/JoinRoomModal'

export default function HomePage() {
  const { user, rooms, loading, error, createRoom, joinRoom, loadData } = useHome()
  const { telegramUser } = useTelegram()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleCreateRoom = async (name) => {
    setActionLoading(true)
    try {
      await createRoom(name)
      setShowCreateModal(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinRoom = async (code) => {
    setActionLoading(true)
    try {
      await joinRoom(code)
      setShowJoinModal(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <HomeHeader user={user} telegramUser={telegramUser} />
      
      <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
        <main className="max-w-2xl mx-auto px-5 py-6">
          <ActionButtons 
            onCreate={() => setShowCreateModal(true)} 
            onJoin={() => setShowJoinModal(true)} 
            darkMode={darkMode}
          />
          
          {rooms.length === 0 ? (
            <EmptyState
              icon="🏠"
              title="Нет комнат"
              description="Создайте новую комнату или присоединитесь по коду"
              actionText="Создать комнату"
              onAction={() => setShowCreateModal(true)}
              darkMode={darkMode}
            />
          ) : (
            <RoomsList rooms={rooms} darkMode={darkMode} />
          )}
        </main>
      </PullToRefresh>

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
    </div>
  )
}