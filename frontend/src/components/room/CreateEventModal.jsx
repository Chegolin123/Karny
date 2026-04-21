// C:\OSPanel\domains\karny\frontend\src\components\room\CreateEventModal.jsx

import { useState } from 'react'

export default function CreateEventModal({ show, onClose, onSubmit, loading, darkMode }) {
  const [newEvent, setNewEvent] = useState({ name: '', description: '', eventDate: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(newEvent.name, newEvent.eventDate, newEvent.description)
    setNewEvent({ name: '', description: '', eventDate: '' })
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Новое событие
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newEvent.name}
            onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
            placeholder="Название"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all mb-3 ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
            required
            disabled={loading}
          />
          <textarea
            value={newEvent.description}
            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
            placeholder="Описание"
            rows="2"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all mb-3 resize-none ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
            disabled={loading}
          />
          <input
            type="datetime-local"
            value={newEvent.eventDate}
            onChange={(e) => setNewEvent({...newEvent, eventDate: e.target.value})}
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all mb-6 ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#3f3f46] text-white [color-scheme:dark]' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
            required
            disabled={loading}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors border ${
                darkMode 
                  ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300 hover:bg-[#3f3f46]' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all disabled:opacity-50 shadow-sm ${
                darkMode
                  ? 'bg-gradient-to-r from-[#2d1b4e] to-[#4c1d95] text-white hover:from-[#3d2563] hover:to-[#6d28d9]'
                  : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] text-white hover:from-[#6d28d9] hover:to-[#7c3aed]'
              }`}
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}