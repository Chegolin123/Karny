// C:\OSPanel\domains\karny\frontend\src\components\room\chat\ChatHeader.jsx

export default function ChatHeader({ connected, darkMode }) {
  return (
    <div className={`px-4 py-2 border-b ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Чат комнаты
        </h3>
        <div className="flex items-center gap-2">
          {!connected && (
            <span className="text-xs text-yellow-500">Подключение...</span>
          )}
          {connected && (
            <span className="text-xs text-green-500">● Онлайн</span>
          )}
        </div>
      </div>
    </div>
  )
}