// C:\OSPanel\domains\karny\frontend\src\components\room\RoomPolls.jsx

import PollMessage from './chat/PollMessage'

export default function RoomPolls({ 
  polls, 
  darkMode, 
  isAdmin, 
  onVote, 
  onClose,
  currentUserId 
}) {
  if (!polls || polls.length === 0) return null

  return (
    <div className="mb-4">
      <div className="space-y-4">
        {polls.map(poll => (
          <PollMessage
            key={poll.id}
            poll={poll}
            isOwn={poll.created_by == currentUserId}
            darkMode={darkMode}
            onVote={onVote}
            onClose={onClose}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  )
}