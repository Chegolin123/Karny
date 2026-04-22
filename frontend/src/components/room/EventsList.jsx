// C:\OSPanel\domains\karny\frontend\src\components\room\EventsList.jsx

import { useState } from 'react'
import EventCard from './EventCard'

export default function EventsList({ 
  events, 
  userAttendances, 
  actionLoading,
  onCreateClick,
  darkMode,
  roomId
}) {
  const [sortBy, setSortBy] = useState('default') // 'default', 'date', 'name', 'going'
  
  // Функция сортировки событий
  const getSortedEvents = () => {
    const eventsCopy = [...events]
    
    switch (sortBy) {
      case 'date':
        // По дате события (ближайшие сверху)
        return eventsCopy.sort((a, b) => {
          if (!a.event_date && !b.event_date) return 0
          if (!a.event_date) return 1
          if (!b.event_date) return -1
          return new Date(a.event_date) - new Date(b.event_date)
        })
      
      case 'name':
        // По алфавиту
        return eventsCopy.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      
      case 'going':
        // По количеству идущих (больше сверху)
        return eventsCopy.sort((a, b) => (b.going_count || 0) - (a.going_count || 0))
      
      case 'voting':
        // Сначала события с голосованием
        return eventsCopy.sort((a, b) => {
          if (a.time_voting_enabled && !b.time_voting_enabled) return -1
          if (!a.time_voting_enabled && b.time_voting_enabled) return 1
          return 0
        })
      
      default:
        // По умолчанию: сначала с голосованием, затем новые сверху
        return eventsCopy.sort((a, b) => {
          // Сначала с голосованием
          if (a.time_voting_enabled && !b.time_voting_enabled) return -1
          if (!a.time_voting_enabled && b.time_voting_enabled) return 1
          // Затем по дате создания (новые сверху)
          return new Date(b.created_at) - new Date(a.created_at)
        })
    }
  }
  
  const sortedEvents = getSortedEvents()
  
  // Опции сортировки
  const sortOptions = [
    { value: 'default', label: 'По умолчанию', icon: '📋' },
    { value: 'date', label: 'По дате', icon: '📅' },
    { value: 'going', label: 'По участникам', icon: '👥' },
    { value: 'voting', label: 'С голосованием', icon: '🗳️' },
    { value: 'name', label: 'По алфавиту', icon: '🔤' }
  ]

  return (
    <section className="w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          События
        </h2>
        <button
          onClick={onCreateClick}
          className={`text-sm sm:text-base font-medium transition-colors ${darkMode ? 'text-[#a78bfa] hover:text-[#c4b5fd]' : 'text-[#8b5cf6] hover:text-[#6d28d9]'}`}
          disabled={actionLoading}
        >
          + Создать
        </button>
      </div>
      
      {/* Селект сортировки */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Сортировка:
          </span>
          <div className="flex gap-1">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                  sortBy === option.value
                    ? darkMode 
                      ? 'bg-[#2d1b4e] text-[#c4b5fd] border border-[#8b5cf6]' 
                      : 'bg-[#f5f3ff] text-[#6d28d9] border border-[#c4b5fd]'
                    : darkMode
                      ? 'bg-[#2a2a30] text-gray-400 border border-[#3f3f46] hover:bg-[#3f3f46]'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className={`text-sm sm:text-base py-8 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Нет запланированных событий
        </p>
      ) : (
        <div className="space-y-3 w-full">
          {sortedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              userStatus={userAttendances[event.id]}
              darkMode={darkMode}
              roomId={roomId}
            />
          ))}
        </div>
      )}
    </section>
  )
}