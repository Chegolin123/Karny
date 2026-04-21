// C:\OSPanel\domains\karny\frontend\src\components\room\EventCard.jsx

import { useState } from 'react'
import { formatEventDate } from '../../utils/formatters'

function getStatusButtonStyle(isActive, status, actionLoading) {
  const baseStyle = 'py-2 px-3 text-xs font-medium border rounded-md transition-all'
  
  if (isActive) {
    const activeStyles = {
      going: 'bg-green-100 border-green-300 text-green-800',
      maybe: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      declined: 'bg-red-100 border-red-300 text-red-800'
    }
    return `${baseStyle} ${activeStyles[status]}`
  }
  
  const styles = {
    going: 'border-green-200 text-green-700 hover:bg-green-50',
    maybe: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50',
    declined: 'border-red-200 text-red-700 hover:bg-red-50'
  }
  return `${baseStyle} ${styles[status]} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`
}

export default function EventCard({ 
  event, 
  userStatus, 
  canEdit,
  canDelete, 
  canRemind,
  onAttend, 
  onEdit,
  onDelete, 
  onRemind,
  onShowAttendees,
  actionLoading 
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [remindLoading, setRemindLoading] = useState(false)

  const handleDeleteClick = () => {
    if (showConfirm) {
      onDelete(event.id)
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  const handleRemindClick = async () => {
    setRemindLoading(true)
    try {
      await onRemind(event.id)
    } finally {
      setRemindLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#8b5cf6]/30 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{event.name}</h3>
          {event.description && (
            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Кнопка-счётчик "Идут" — показывает ТОЛЬКО тех, кто нажал "Иду" */}
          <button
            onClick={() => onShowAttendees(event.id, event.name, 'going')}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium hover:bg-green-200 transition-colors flex items-center gap-1"
            title="Список участников, которые идут"
          >
            <span>✅</span>
            <span>{event.going_count || 0}</span>
          </button>
          
          {canEdit && (
            <button
              onClick={() => onEdit(event)}
              className="p-1 text-gray-400 hover:text-[#8b5cf6] transition-colors"
              title="Редактировать"
              disabled={actionLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {canRemind && (
            <button
              onClick={handleRemindClick}
              className="p-1 text-gray-400 hover:text-[#8b5cf6] transition-colors"
              title="Напомнить участникам"
              disabled={actionLoading || remindLoading}
            >
              {remindLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={handleDeleteClick}
              className={`p-1 transition-colors ${showConfirm ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              title={showConfirm ? 'Нажмите для подтверждения' : 'Удалить'}
              disabled={actionLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">{formatEventDate(event.event_date)}</p>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onAttend(event.id, 'going')}
          className={getStatusButtonStyle(userStatus === 'going', 'going', actionLoading)}
          disabled={actionLoading}
        >
          Иду
        </button>
        <button
          onClick={() => onAttend(event.id, 'maybe')}
          className={getStatusButtonStyle(userStatus === 'maybe', 'maybe', actionLoading)}
          disabled={actionLoading}
        >
          Возможно
        </button>
        <button
          onClick={() => onAttend(event.id, 'declined')}
          className={getStatusButtonStyle(userStatus === 'declined', 'declined', actionLoading)}
          disabled={actionLoading}
        >
          Не иду
        </button>
      </div>
    </div>
  )
}