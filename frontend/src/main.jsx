// C:\OSPanel\domains\karny\frontend\src\main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ThemeProvider from './components/common/ThemeProvider'
import { NotificationProvider } from './contexts/NotificationContext'
import NotificationContainer from './components/notifications/NotificationContainer'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'

let errorCount = 0
const maxErrors = 3

window.addEventListener('error', (event) => {
  console.error('🌍 Global error:', event.error)
  errorCount++
  
  if (errorCount >= maxErrors) {
    localStorage.setItem('auto_reload', 'true')
    window.location.reload()
  }
  
  const root = document.getElementById('root')
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui; padding: 20px; text-align: center;">
        <div>
          <div style="font-size: 48px; margin-bottom: 16px;">😵</div>
          <h2 style="margin-bottom: 8px;">Что-то пошло не так</h2>
          <p style="color: #666; margin-bottom: 20px;">Попробуйте обновить страницу</p>
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: #8b5cf6; color: white; border: none; border-radius: 12px; font-size: 16px; cursor: pointer;">
            Обновить
          </button>
        </div>
      </div>
    `
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🌍 Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

if (localStorage.getItem('auto_reload') === 'true') {
  localStorage.removeItem('auto_reload')
  console.log('🔄 Автообновление после ошибки')
}

const initApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <NotificationProvider>
            <App />
            <NotificationContainer />
          </NotificationProvider>
        </ThemeProvider>
      </ErrorBoundary>
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