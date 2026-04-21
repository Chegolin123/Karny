// C:\OSPanel\domains\karny\frontend\src\components\room\MembersList.jsx

import MemberAvatar from './MemberAvatar'

export default function MembersList({ members, ownerId }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Участники</h2>
      <div className="flex flex-wrap gap-3">
        {members.map(member => (
          <div key={member.id} className="flex flex-col items-center">
            <MemberAvatar 
              member={member} 
              isOwner={member.id === ownerId}
            />
            <span className="text-xs text-gray-600 mt-1.5 max-w-[64px] truncate">
              {member.first_name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}