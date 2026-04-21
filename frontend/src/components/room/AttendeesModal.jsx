// C:\OSPanel\domains\karny\frontend\src\components\room\AttendeesModal.jsx

import { useState, useEffect } from 'react'
import * as api from '../../api'
import MemberAvatar from './MemberAvatar'

export default function AttendeesModal({ show, onClose, roomId, eventId, eventName, filterStatus = null, darkMode }) {
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (show && roomId && eventId) {
      loadAttendees()
    }
  }, [show, roomId, eventId])

  const loadAttendees = async () => {
    try {
      setLoading(true)
      const data = await api.getEventAttendees(roomId, eventId)
      
      if (filterStatus === 'going') {
        setAttendees(data.going || [])
      } else {
        setAttendees([
          ...(data.going || []).map(u => ({ ...u, status: 'going' })),
          ...(data.maybe || []).map(u => ({ ...u, status: 'maybe' })),
          ...(data.declined || []).map(u => ({ ...u, status: 'declined' }))
        ])
      }
    } catch (err) {
      console.error('Ошибка загрузки участников:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto animate-slideUp ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {filterStatus === 'going' ? 'Идут' : 'Участники'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors border ${
              darkMode 
                ? 'text-gray-400 border-[#3f3f46] hover:text-white hover:bg-[#2a2a30]' 
                : 'text-gray-500 border-gray-200 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className={`text-sm mb-4 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {eventName}
        </p>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : attendees.length === 0 ? (
          <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {filterStatus === 'going' ? 'Пока никто не идёт' : 'Пока никто не отметился'}
          </p>
        ) : (
          <div className="space-y-2">
            {attendees.map(user => (
              <div key={user.id} className="flex items-center gap-3 py-1">
                <MemberAvatar member={user} isOwner={false} />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {user.first_name} {user.last_name || ''}
                  </p>
                  {user.username && (
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      @{user.username}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={onClose}
            className={`w-full py-3 text-sm font-medium rounded-lg transition-colors border ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300 hover:bg-[#3f3f46]' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}