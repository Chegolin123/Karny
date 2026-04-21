// C:\OSPanel\domains\karny\frontend\src\components\room\EventsList.jsx

import EventCard from './EventCard'

export default function EventsList({ 
  events, 
  userAttendances, 
  canEditEvent,
  canDeleteEvent,
  canRemindEvent,
  onAttend,
  onEdit,
  onDelete,
  onRemind,
  onShowAttendees,
  actionLoading,
  onCreateClick 
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">События</h2>
        <button
          onClick={onCreateClick}
          className="text-sm text-[#8b5cf6] hover:text-[#6d28d9] font-medium transition-colors"
          disabled={actionLoading}
        >
          + Создать
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Нет запланированных событий</p>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              userStatus={userAttendances[event.id]}
              canEdit={canEditEvent(event.created_by)}
              canDelete={canDeleteEvent(event.created_by)}
              canRemind={canRemindEvent(event.created_by)}
              onAttend={onAttend}
              onEdit={onEdit}
              onDelete={onDelete}
              onRemind={onRemind}
              onShowAttendees={onShowAttendees}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </section>
  )
}