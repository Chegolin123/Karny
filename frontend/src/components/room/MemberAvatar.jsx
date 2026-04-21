// C:\OSPanel\domains\karny\frontend\src\components\room\MemberAvatar.jsx

import { useState } from 'react'
import { getInitials } from '../../utils/avatar'

export default function MemberAvatar({ member, isOwner, size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm'
  }
  
  return (
    <div className="relative">
      {member.photo_url && !imgError ? (
        <img
          src={member.photo_url}
          alt=""
          className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium border border-gray-200`}>
          {getInitials(member.first_name, member.last_name)}
        </div>
      )}
      {isOwner && (
        <span className="absolute -top-0.5 -right-0.5 text-sm leading-none drop-shadow-sm">👑</span>
      )}
    </div>
  )
}