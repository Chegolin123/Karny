// C:\OSPanel\domains\karny\frontend\src\pages\CalendarPage.jsx

import { useTheme } from '../components/common/ThemeProvider'
import EventCalendar from '../components/home/EventCalendar'
import { Link } from 'react-router-dom'

export default function CalendarPage() {
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-[#0f0f13]' : 'bg-[#fafafa]'}`}>
      <header className={`flex-shrink-0 ${darkMode ? 'bg-[#1a1a1e] border-b border-[#2a2a30]' : 'bg-white border-b border-gray-200'}`}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className={`p-2 -ml-2 rounded-full ${darkMode ? 'hover:bg-[#2a2a30]' : 'hover:bg-gray-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Календарь событий
            </h1>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4">
        <EventCalendar darkMode={darkMode} />
      </div>
    </div>
  )
}