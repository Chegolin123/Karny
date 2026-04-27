// C:\OSPanel\domains\karny\frontend\src\components\room\EventsList.jsx

import EventCard from './EventCard'

export default function EventsList({ 
  events, 
  userAttendances, 
  actionLoading,
  onCreateClick,
  darkMode,
  roomId
}) {
  if (!events) {
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
        <p className={`text-sm sm:text-base py-8 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Загрузка событий...
        </p>
      </section>
    )
  }
  
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

      {events.length === 0 ? (
        <p className={`text-sm sm:text-base py-8 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Нет запланированных событий
        </p>
      ) : (
        <div className="space-y-3 w-full">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              userStatus={userAttendances?.[event.id]}
              darkMode={darkMode}
              roomId={roomId}
            />
          ))}
        </div>
      )}
    </section>
  )
}