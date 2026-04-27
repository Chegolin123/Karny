// C:\OSPanel\domains\karny\frontend\src\hooks\useTelegram.js

import { useState, useEffect } from 'react'

export function useTelegram() {
  const [telegramUser, setTelegramUser] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [colorScheme, setColorScheme] = useState('light')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    
    if (tg) {
      tg.ready()
      tg.expand()
      
      setTimeout(() => {
        const headerColor = tg.colorScheme === 'dark' ? '#1e1136' : '#4c1d95'
        tg.setHeaderColor(headerColor)
        tg.setBackgroundColor(tg.colorScheme === 'dark' ? '#0f0f13' : '#fafafa')
      }, 50)
      
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user)
      }
      
      setColorScheme(tg.colorScheme || 'light')
      
      // Слушаем изменение темы
      tg.onEvent('themeChanged', () => {
        setColorScheme(tg.colorScheme)
        const headerColor = tg.colorScheme === 'dark' ? '#1e1136' : '#4c1d95'
        tg.setHeaderColor(headerColor)
        tg.setBackgroundColor(tg.colorScheme === 'dark' ? '#0f0f13' : '#fafafa')
      })
      
      setIsReady(true)
    }
  }, [])

  return {
    telegramUser,
    isReady,
    colorScheme,
    webApp: window.Telegram?.WebApp
  }
}