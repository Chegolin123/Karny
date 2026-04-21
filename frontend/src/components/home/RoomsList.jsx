// C:\OSPanel\domains\karny\frontend\src\components\home\RoomsList.jsx

import RoomCard from './RoomCard'

export default function RoomsList({ rooms, darkMode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-medium uppercase tracking-wider ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Комнаты
        </h2>
        {rooms.length > 0 && (
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {rooms.length}
          </span>
        )}
      </div>
      
      {rooms.length === 0 ? (
        <div className="py-12 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Нет активных комнат
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <RoomCard key={room.id} room={room} darkMode={darkMode} />
          ))}
        </div>
      )}
    </div>
  )
}