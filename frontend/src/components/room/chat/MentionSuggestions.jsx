// C:\OSPanel\domains\karny\frontend\src\components\room\chat\MentionSuggestions.jsx

import { useEffect, useRef } from 'react'
import MemberAvatar from '../MemberAvatar'

export default function MentionSuggestions({ 
  members, 
  searchQuery, 
  onSelect, 
  darkMode,
  top,
  left 
}) {
  const suggestionsRef = useRef(null)
  
  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true
    const name = `${m.first_name} ${m.last_name || ''}`.toLowerCase()
    const username = (m.username || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || username.includes(query)
  }).slice(0, 5)
  
  if (filteredMembers.length === 0) return null
  
  return (
    <div
      ref={suggestionsRef}
      className={`absolute z-50 w-64 max-h-64 overflow-y-auto rounded-xl shadow-lg border ${
        darkMode 
          ? 'bg-[#1a1a1e] border-[#2a2a30]' 
          : 'bg-white border-gray-200'
      }`}
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      {filteredMembers.map(member => (
        <button
          key={member.id}
          onClick={() => onSelect(member)}
          className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${
            darkMode 
              ? 'hover:bg-[#2a2a30]' 
              : 'hover:bg-gray-100'
          }`}
        >
          <MemberAvatar member={member} size="sm" />
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {member.first_name} {member.last_name || ''}
            </p>
            {member.username && (
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                @{member.username}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}