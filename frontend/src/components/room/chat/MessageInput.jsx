// C:\OSPanel\domains\karny\frontend\src\components\room\chat\MessageInput.jsx

import { useState, useRef, useEffect } from 'react'

export default function MessageInput({ 
  connected, 
  darkMode, 
  onSendMessage, 
  onTyping,
  replyTo,
  onCancelReply 
}) {
  const [newMessage, setNewMessage] = useState('')
  const typingTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus()
    }
  }, [replyTo])

  const handleTyping = (e) => {
    const value = e.target.value
    setNewMessage(value)
    
    onTyping?.(value.length > 0)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false)
    }, 1000)
  }

  const handleSend = () => {
    if (!connected || !newMessage.trim()) return
    
    const sent = onSendMessage(newMessage.trim(), replyTo?.id)
    if (sent) {
      setNewMessage('')
      if (replyTo) onCancelReply?.()
    }
  }

  return (
    <div className={`flex-shrink-0 p-3 border-t ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
      {/* Индикатор ответа */}
      {replyTo && (
        <div className={`mb-2 px-3 py-2 rounded-xl flex items-center justify-between ${
          darkMode ? 'bg-[#2a2a30]' : 'bg-gray-100'
        }`}>
          <div className="flex-1 min-w-0">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Ответ: {replyTo.user?.first_name}
            </span>
            <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className={`p-2 rounded-full -mr-1 ${darkMode ? 'hover:bg-[#3f3f46]' : 'hover:bg-gray-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder={connected ? 'Сообщение' : 'Подключение...'}
          disabled={!connected}
          className={`flex-1 px-4 py-3 text-base border rounded-full focus:outline-none focus:border-[#8b5cf6] transition-colors ${
            darkMode 
              ? 'bg-[#0f0f13] border-[#3f3f46] text-white placeholder-gray-500' 
              : 'bg-gray-50 border-gray-200 text-gray-900'
          }`}
        />
        <button
          onClick={handleSend}
          disabled={!connected || !newMessage.trim()}
          className={`p-3 rounded-full transition-all ${
            connected && newMessage.trim()
              ? 'bg-[#6d28d9] text-white hover:bg-[#5b21b6] hover:scale-105' 
              : darkMode ? 'bg-[#2a2a30] text-gray-500' : 'bg-gray-200 text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}