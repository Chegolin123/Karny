// C:\OSPanel\domains\karny\frontend\src\components\common\ThemeProvider.jsx

import { createContext, useContext, useEffect, useState } from 'react'
import { useTelegram } from '../../hooks/useTelegram'

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }) {
  const { colorScheme } = useTelegram()
  const [theme, setThemeState] = useState('system')

  useEffect(() => {
    const savedTheme = localStorage.getItem('karny_theme') || 'system'
    setThemeState(savedTheme)
  }, [])

  const getActualTheme = () => {
    if (theme === 'system') {
      return colorScheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
    return theme
  }

  const actualTheme = getActualTheme()

  useEffect(() => {
    if (actualTheme === 'dark') {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [actualTheme])

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('karny_theme', newTheme)
  }

  const toggleTheme = () => {
    const current = getActualTheme()
    setTheme(current === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ 
      theme: actualTheme,
      themePreference: theme,
      setTheme, 
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}