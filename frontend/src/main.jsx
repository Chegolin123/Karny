// C:\OSPanel\domains\karny\frontend\src\main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ThemeProvider from './components/common/ThemeProvider'
import './index.css'

const initApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  )
}

if (window.Telegram?.WebApp) {
  console.log('✅ Telegram SDK уже загружен')
  initApp()
} else {
  console.log('⏳ Ожидание загрузки Telegram SDK...')
  
  let attempts = 0
  const maxAttempts = 20
  
  const checkInterval = setInterval(() => {
    attempts++
    
    if (window.Telegram?.WebApp) {
      console.log('✅ Telegram SDK загружен')
      clearInterval(checkInterval)
      initApp()
    } else if (attempts >= maxAttempts) {
      console.warn('⚠️ Telegram SDK не загружен, запускаем в dev-режиме')
      clearInterval(checkInterval)
      initApp()
    }
  }, 100)
}