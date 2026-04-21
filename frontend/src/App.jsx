// C:\OSPanel\domains\karny\frontend\src\App.jsx

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'
import RoomChatPage from './pages/RoomChatPage' // ← Добавлен импорт

function App() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#4c1d95')
      tg.setBackgroundColor('#fafafa')
      
      if (tg.setBottomBarColor) {
        tg.setBottomBarColor('#fafafa')
      }
      
      tg.enableClosingConfirmation()
      
      console.log('🚀 App: Telegram WebApp инициализирован')
      console.log('👤 Пользователь:', tg.initDataUnsafe?.user)
    } else {
      console.log('⚠️ Режим разработки (не в Telegram)')
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:id" element={<RoomPage />} />
        <Route path="/room/:id/chat" element={<RoomChatPage />} /> {/* ← Новый маршрут */}
      </Routes>
    </BrowserRouter>
  )
}

export default App