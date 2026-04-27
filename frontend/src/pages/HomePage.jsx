// C:\OSPanel\domains\karny\frontend\src\pages\HomePage.jsx

import { useState, useEffect } from 'react'
import { useTheme } from '../components/common/ThemeProvider'
import { useHome } from '../hooks/useHome'
import { useNotification } from '../contexts/NotificationContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import PullToRefresh from '../components/common/PullToRefresh'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import NextEventCard from '../components/dashboard/NextEventCard'
import ActiveChatsList from '../components/dashboard/ActiveChatsList'
import QuickActions from '../components/dashboard/QuickActions'
import JoinRoomModal from '../components/home/JoinRoomModal'
import * as api from '../api'

export default function HomePage() {
  const { user, rooms, loading, error, loadData, joinRoom } = useHome()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  const { notifySuccess, notifyError } = useNotification()
  
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({ roomsCount: 0, todayEventsCount: 0 })
  
  useEffect(() => {
    loadStats()
  }, [rooms])
  
  const loadStats = async () => {
    try {
      const eventsData = await api.getUserEvents()
      const today = new Date().toDateString()
      const todayEvents = (eventsData.events || []).filter(e => {
        if (!e.event_date) return false
        return new Date(e.event_date).toDateString() === today
      })
      
      setStats({
        roomsCount: rooms?.length || 0,
        todayEventsCount: todayEvents.length
      })
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err)
    }
  }
  
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    await loadStats()
    setRefreshing(false)
  }
  
  const handleJoinRoom = async (code, password) => {
    setActionLoading(true)
    try {
      const result = await joinRoom(code, password)
      setShowJoinModal(false)
      notifySuccess(result.message || 'Вы присоединились к комнате!')
      await loadData()
    } catch (err) {
      notifyError(err.message)
      throw err
    } finally {
      setActionLoading(false)
    }
  }
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <div className={`h-full overflow-hidden flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <DashboardHeader darkMode={darkMode} stats={stats} />
          
          <div className="py-4">
            <NextEventCard darkMode={darkMode} onAttend={loadStats} />
            <ActiveChatsList darkMode={darkMode} />
            <QuickActions darkMode={darkMode} onJoin={() => setShowJoinModal(true)} />
          </div>
        </main>
      </PullToRefresh>
      
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