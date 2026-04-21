// C:\OSPanel\domains\karny\frontend\src\components\common\ThemeProvider.jsx

import { createContext, useContext, useEffect, useState } from 'react'
import { useTelegram } from '../../hooks/useTelegram'

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }) {
  const { colorScheme } = useTelegram()
  const [theme, setTheme] = useState('light')
  const [userPreference, setUserPreference] = useState(null)

  useEffect(() => {
    // Загружаем сохранённую тему
    const savedTheme = localStorage.getItem('karny_theme')
    
    if (savedTheme) {
      setTheme(savedTheme)
      setUserPreference(savedTheme)
    } else if (colorScheme) {
      setTheme(colorScheme)
    } else {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
    }
  }, [colorScheme])

  useEffect(() => {
    // Применяем класс к body
    if (theme === 'dark') {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    setUserPreference(newTheme)
    localStorage.setItem('karny_theme', newTheme)
  }

  const resetToSystem = () => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(systemTheme)
    setUserPreference(null)
    localStorage.removeItem('karny_theme')
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme, 
      resetToSystem,
      userPreference 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}