// C:\OSPanel\domains\karny\frontend\src\App.jsx

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'

// Страницы с нижним меню
import HomePage from './pages/HomePage'
import RoomsPage from './pages/RoomsPage'
import ChatsPage from './pages/ChatsPage'
import ProfilePage from './pages/ProfilePage'

// Страницы без нижнего меню
import RoomPage from './pages/RoomPage'
import RoomChatPage from './pages/RoomChatPage'
import EventPage from './pages/EventPage'
import CalendarPage from './pages/CalendarPage'

function App() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    
    if (tg) {
      tg.ready()
      tg.expand()
      
      // Устанавливаем цвета для Telegram Mini App
      tg.setHeaderColor('#4c1d95')
      tg.setBackgroundColor('#fafafa')
      
      // Android поддерживает setBottomBarColor
      if (tg.setBottomBarColor) {
        tg.setBottomBarColor('#fafafa')
      }
      
      tg.enableClosingConfirmation()
      
      // Обработка кнопки "Назад" на Android
      tg.onEvent('backButtonClicked', () => {
        if (window.location.pathname !== '/') {
          window.history.back()
        } else {
          tg.close()
        }
      })
      
      console.log('🚀 App: Telegram WebApp инициализирован')
      console.log('👤 Пользователь:', tg.initDataUnsafe?.user)
    } else {
      console.log('⚠️ Режим разработки (не в Telegram)')
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Страницы с нижним меню */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        
        {/* Страницы без нижнего меню */}
        <Route path="/room/:id" element={<RoomPage />} />
        <Route path="/room/:id/chat" element={<RoomChatPage />} />
        <Route path="/room/:roomId/event/:eventId" element={<EventPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App