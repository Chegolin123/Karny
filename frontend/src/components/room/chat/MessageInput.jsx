// C:\OSPanel\domains\karny\frontend\src\components\room\chat\MessageInput.jsx

import { useState, useRef, useEffect } from 'react'

export default function MessageInput({ connected, darkMode, onSendMessage, onTyping }) {
  const [newMessage, setNewMessage] = useState('')
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (!connected || !newMessage.trim()) return
    
    const sent = onSendMessage(newMessage.trim())
    if (sent) {
      setNewMessage('')
    }
  }

  return (
    <div className={`p-3 border-t ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          placeholder={connected ? 'Сообщение' : 'Подключение...'}
          disabled={!connected}
          className={`flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors ${
            darkMode 
              ? 'bg-[#0f0f13] border-[#3f3f46] text-white placeholder-gray-500 disabled:opacity-50' 
              : 'bg-gray-50 border-gray-200 text-gray-900 disabled:bg-gray-100'
          }`}
        />
        <button
          onClick={handleSend}
          disabled={!connected || !newMessage.trim()}
          className={`p-2.5 rounded-full transition-all ${
            connected && newMessage.trim()
              ? 'bg-[#6d28d9] text-white hover:bg-[#5b21b6] hover:scale-105' 
              : darkMode ? 'bg-[#2a2a30] text-gray-500' : 'bg-gray-200 text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}