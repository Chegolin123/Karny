import { useState, useEffect } from 'react'

export default function CreateEventModal({ show, onClose, onSubmit, loading, darkMode, event }) {
  const [newEvent, setNewEvent] = useState({ 
    name: '', description: '', eventDate: '', timeVotingEnabled: false,
    videoEnabled: false, videoUrl: ''
  })

  useEffect(() => {
    if (!event) return
    if (show) {
      setNewEvent({
        name: event.name || '',
        description: event.description || '',
        eventDate: event.event_date || '',
        timeVotingEnabled: event.time_voting_enabled || false,
        videoEnabled: !!event.video_url,
        videoUrl: event.video_url || ''
      })
    }
  }, [show, event])

  const detectPlatform = (url) => {
    if (!url) return null
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newEvent.name.trim()) return
    
    if (!newEvent.timeVotingEnabled && !newEvent.eventDate) {
      alert('Укажите дату или включите обсуждение времени')
      return
    }

    if (newEvent.videoEnabled && newEvent.videoUrl && !detectPlatform(newEvent.videoUrl)) {
      alert('Поддерживаются только ссылки YouTube')
      return
    }
    
    onSubmit(
      newEvent.name, 
      newEvent.eventDate || null,
      newEvent.description || '',
      newEvent.timeVotingEnabled,
      newEvent.videoEnabled ? newEvent.videoUrl : null
    )
    setNewEvent({ name: '', description: '', eventDate: '', timeVotingEnabled: false, videoEnabled: false, videoUrl: '' })
  }

  if (!show) return null

  const platform = detectPlatform(newEvent.videoUrl)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`}>
        <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {event ? 'Редактировать событие' : 'Новое событие'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input type="text" value={newEvent.name} onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
            placeholder="Название"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-3 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            required disabled={loading} />
          <textarea value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
            placeholder="Описание" rows="2"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-3 resize-none ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            disabled={loading} />
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setNewEvent({...newEvent, timeVotingEnabled: false})}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border-2 transition-all ${!newEvent.timeVotingEnabled ? (darkMode ? 'border-[#8b5cf6] bg-[#2d1b4e] text-[#c4b5fd]' : 'border-[#8b5cf6] bg-[#f5f3ff] text-[#6d28d9]') : (darkMode ? 'border-[#2a2a30] text-gray-400' : 'border-gray-200 text-gray-500')}`}>
                📅 Указать время
              </button>
              <button type="button" onClick={() => setNewEvent({...newEvent, timeVotingEnabled: true, eventDate: ''})}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border-2 transition-all ${newEvent.timeVotingEnabled ? (darkMode ? 'border-[#8b5cf6] bg-[#2d1b4e] text-[#c4b5fd]' : 'border-[#8b5cf6] bg-[#f5f3ff] text-[#6d28d9]') : (darkMode ? 'border-[#2a2a30] text-gray-400' : 'border-gray-200 text-gray-500')}`}>
                🗳️ Обсудить время
              </button>
            </div>
            {!newEvent.timeVotingEnabled && (
              <input type="datetime-local" value={newEvent.eventDate} onChange={(e) => setNewEvent({...newEvent, eventDate: e.target.value})}
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                required={!newEvent.timeVotingEnabled} disabled={loading} />
            )}
          </div>
          
          <div className={`p-4 rounded-lg border mb-4 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46]' : 'bg-gray-50 border-gray-200'}`}>
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                🎬 Добавить видео YouTube
              </span>
              <input type="checkbox" checked={newEvent.videoEnabled} onChange={(e) => setNewEvent({...newEvent, videoEnabled: e.target.checked, videoUrl: e.target.checked ? newEvent.videoUrl : ''})}
                className="w-5 h-5 accent-[#8b5cf6]" />
            </label>
            
            {newEvent.videoEnabled && (
              <div className="space-y-2">
                <input type="url" value={newEvent.videoUrl} onChange={(e) => setNewEvent({...newEvent, videoUrl: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] ${darkMode ? 'bg-[#1a1a1e] border-[#3f3f46] text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                  disabled={loading} />
                {platform === 'youtube' && (
                  <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ✅ YouTube — ссылка распознана
                  </p>
                )}
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Поддерживается YouTube. В назначенное время начнётся синхронный просмотр.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className={`flex-1 py-3 text-sm font-medium rounded-lg border ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300 hover:bg-[#3f3f46]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              disabled={loading}>Отмена</button>
            <button type="submit"
              className={`flex-1 py-3 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-50 ${darkMode ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#a78bfa]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] hover:from-[#5b21b6] hover:to-[#7c3aed]'}`}
              disabled={loading}>{loading ? 'Создание...' : (event ? 'Сохранить' : 'Создать')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
