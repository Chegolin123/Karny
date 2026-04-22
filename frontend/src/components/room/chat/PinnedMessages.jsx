// C:\OSPanel\domains\karny\frontend\src\components\room\chat\PinnedMessages.jsx

import { useState } from 'react'
import MemberAvatar from '../MemberAvatar'

export default function PinnedMessages({ 
  messages, 
  members, 
  currentUserIdStr,
  darkMode,
  onUnpin,
  isAdmin,
  onReply
}) {
  const [expanded, setExpanded] = useState(false)
  
  if (!messages || !members || messages.length === 0) return null
  
  const displayMessages = expanded ? messages : [messages[messages.length - 1]]
  
  return (
    <div className={`flex-shrink-0 border-b ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <svg className={`w-4 h-4 ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Закреплено · {messages.length}
            </span>
          </div>
          {messages.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-xs font-medium ${darkMode ? 'text-[#a78bfa]' : 'text-[#8b5cf6]'}`}
            >
              {expanded ? 'Свернуть' : 'Все'}
            </button>
          )}
        </div>
        
        <div className={`space-y-2 ${expanded ? 'max-h-40' : ''} overflow-y-auto`}>
          {displayMessages.map(msg => {
            const sender = msg.user || members?.find(m => String(m.id) === String(msg.userId))
            
            if (!sender) return null
            
            return (
              <div 
                key={msg.id} 
                className={`flex items-start gap-2 p-2 rounded-xl ${
                  darkMode ? 'bg-[#2a2a30]' : 'bg-gray-100'
                }`}
              >
                <MemberAvatar member={sender} size="sm" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {sender?.first_name}
                    </span>
                    {msg.is_edited && (
                      <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(ред.)</span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {msg.content}
                  </p>
                </div>
                
                {isAdmin && (
                  <button
                    onClick={() => onUnpin(msg)}
                    className={`p-2 rounded-full transition-colors ${
                      darkMode ? 'hover:bg-[#3f3f46] text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}