// C:\OSPanel\domains\karny\frontend\src\components\room\chat\TypingIndicator.jsx

export default function TypingIndicator({ typingUsers, members, darkMode }) {
  if (typingUsers.size === 0) return null
  
  const typingNames = Array.from(typingUsers)
    .map(id => members.find(m => String(m.id) === String(id))?.first_name)
    .filter(Boolean)
  
  if (typingNames.length === 0) return null
  
  let text = ''
  if (typingNames.length === 1) text = `${typingNames[0]} печатает...`
  else if (typingNames.length === 2) text = `${typingNames[0]} и ${typingNames[1]} печатают...`
  else text = `${typingNames.length} человека печатают...`
  
  return (
    <div className="flex justify-start mt-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7" />
        <div className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {text}
        </div>
      </div>
    </div>
  )
}