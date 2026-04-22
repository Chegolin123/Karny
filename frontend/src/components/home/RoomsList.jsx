// C:\OSPanel\domains\karny\frontend\src\components\home\RoomsList.jsx

import RoomCard from './RoomCard'

export default function RoomsList({ rooms, darkMode, showJoinButton, onJoin }) {
  return (
    <div className="space-y-3">
      {rooms.map(room => (
        <RoomCard 
          key={room.id} 
          room={room} 
          darkMode={darkMode} 
          showJoinButton={showJoinButton}
          onJoin={onJoin}
        />
      ))}
    </div>
  )
}