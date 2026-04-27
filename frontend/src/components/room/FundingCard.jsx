import { useState } from 'react'
import * as api from '../../api'

export default function FundingCard({ funding, darkMode, isAdmin, onUpdate }) {
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const percent = funding.goal > 0 ? Math.min(100, Math.round((funding.collected / funding.goal) * 100)) : 0
  const isDone = funding.collected >= funding.goal
  const isClosed = funding.is_closed

  const handleContribute = async (e) => {
    e.preventDefault()
    if (!amount || amount <= 0) return
    setLoading(true)
    try {
      await api.contributeFunding(funding.room_id, funding.id, parseFloat(amount), note)
      setShowContribute(false)
      setAmount('')
      setNote('')
      onUpdate?.()
    } catch (err) { alert('Ошибка: ' + err.message) }
    finally { setLoading(false) }
  }

  const handleClose = async () => {
    if (!confirm('Закрыть сбор?')) return
    try {
      await api.closeFunding(funding.room_id, funding.id)
      onUpdate?.()
    } catch (err) { alert('Ошибка: ' + err.message) }
  }

  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1a1a1e] border-[#2a2a30]' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{funding.title}</h3>
            {funding.description && (
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{funding.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isClosed || isDone ? (
            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
              {isDone ? '✅ Цель достигнута' : '🔒 Закрыт'}
            </span>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              Активен
            </span>
          )}
          {funding.event_id && <span className="text-xs text-gray-400">📅</span>}
          {funding.poll_id && <span className="text-xs text-gray-400">📊</span>}
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {funding.collected.toLocaleString()} ₽
          </span>
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            {percent}% из {funding.goal.toLocaleString()} ₽
          </span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-[#3f3f46]' : 'bg-gray-200'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : 'bg-[#6d28d9]'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2">
        {!isClosed && !isDone && (
          <button onClick={() => setShowContribute(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-[#2d1b4e] text-[#c4b5fd] hover:bg-[#3d2563]' : 'bg-[#f5f3ff] text-[#6d28d9] hover:bg-[#ede9fe]'} transition-colors`}>
            💰 Пополнить
          </button>
        )}
        <button onClick={() => setShowHistory(!showHistory)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}>
          {showHistory ? 'Скрыть' : '📋 История'}
        </button>
        {isAdmin && !isClosed && (
          <button onClick={handleClose}
            className={`py-2 px-3 text-sm font-medium rounded-lg ${darkMode ? 'bg-[#2a2a30] text-gray-400 hover:bg-[#3f3f46]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} transition-colors`}>
            ✕
          </button>
        )}
      </div>

      {/* Модалка пополнения */}
      {showContribute && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowContribute(false)}>
          <form onSubmit={handleContribute} className={`p-6 rounded-2xl max-w-sm mx-4 w-full ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>💰 Пополнить сбор</h3>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Сумма" min="1" step="1" required
              className={`w-full px-4 py-3 border rounded-lg text-sm mb-3 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white' : 'bg-gray-50 border-gray-200'}`} />
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="От кого / комментарий"
              className={`w-full px-4 py-3 border rounded-lg text-sm mb-4 ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-white' : 'bg-gray-50 border-gray-200'}`} />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowContribute(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl border ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>Отмена</button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] transition-colors disabled:opacity-50">
                {loading ? '...' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* История взносов */}
      {showHistory && (
        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
          {funding.contributions?.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {funding.contributions.map(c => (
                <div key={c.id} className="flex justify-between items-center text-sm">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {c.first_name} {c.last_name}
                    {c.note && <span className="text-xs text-gray-400 ml-1">— {c.note}</span>}
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-[#a78bfa]' : 'text-[#6d28d9]'}`}>
                    +{c.amount} ₽
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Взносов пока нет</p>
          )}
        </div>
      )}
    </div>
  )
}
