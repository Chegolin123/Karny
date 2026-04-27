import { useState } from 'react'

export default function CreateFundingModal({ show, onClose, onSubmit, loading, darkMode, events = [], polls = [] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [eventId, setEventId] = useState('')
  const [pollId, setPollId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !goal || goal <= 0) return
    onSubmit(title.trim(), description.trim(), parseFloat(goal), eventId || null, pollId || null)
    setTitle('')
    setDescription('')
    setGoal('')
    setEventId('')
    setPollId('')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`}>
        <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>💰 Новый сбор</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Название сбора" required
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-3 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
          
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Описание (на что собираем)" rows="2"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-3 resize-none ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
          
          <input type="number" value={goal} onChange={e => setGoal(e.target.value)}
            placeholder="Цель (₽)" min="1" step="1" required
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-3 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />

          {/* Привязка к событию */}
          {events.length > 0 && (
            <select value={eventId} onChange={e => { setEventId(e.target.value); setPollId('') }}
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-3 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
              <option value="">Без привязки</option>
              <optgroup label="📅 События">
                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </optgroup>
            </select>
          )}

          {/* Привязка к опросу */}
          {polls.length > 0 && (
            <select value={pollId} onChange={e => { setPollId(e.target.value); setEventId('') }}
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-4 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
              <option value="">Без привязки</option>
              <optgroup label="📊 Опросы">
                {polls.map(p => <option key={p.id} value={p.id}>{p.question}</option>)}
              </optgroup>
            </select>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className={`flex-1 py-3 text-sm font-medium rounded-lg border ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300 hover:bg-[#3f3f46]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              disabled={loading}>Отмена</button>
            <button type="submit"
              className={`flex-1 py-3 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-50 ${darkMode ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'}`}
              disabled={loading}>{loading ? 'Создание...' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
