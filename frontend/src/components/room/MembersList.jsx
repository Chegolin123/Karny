// C:\OSPanel\domains\karny\frontend\src\components\room\MembersList.jsx

import MemberAvatar from './MemberAvatar'

export default function MembersList({ members, ownerId, darkMode }) {
  return (
    <section className="mb-8 w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Участники
        </h2>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${
          darkMode 
            ? 'bg-[#2a2a30] text-gray-300 border border-[#3f3f46]' 
            : 'bg-gray-100 text-gray-700 border border-gray-200'
        }`}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-sm font-semibold">{members.length}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {members.map(member => (
          <div key={member.id} className="flex flex-col items-center w-16 sm:w-20">
            <MemberAvatar 
              member={member} 
              isOwner={member.id === ownerId}
              size="lg"
            />
            <span className={`text-xs sm:text-sm font-medium mt-2 w-full text-center truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {member.first_name}
            </span>
            {member.id === ownerId && (
              <span className={`text-[10px] sm:text-xs mt-0.5 px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
              }`}>
                Создатель
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}