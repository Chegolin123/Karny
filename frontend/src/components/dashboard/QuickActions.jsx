// C:\OSPanel\domains\karny\frontend\src\components\dashboard\QuickActions.jsx

import { Link } from 'react-router-dom'

export default function QuickActions({ darkMode, onJoin }) {
  return (
    <div className="mx-4 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/rooms"
          className={`py-3 px-4 rounded-xl text-center font-medium transition-colors ${
            darkMode 
              ? 'bg-[#1a1a1e] text-white hover:bg-[#2a2a30] border border-[#2a2a30]' 
              : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          🏢 Мои комнаты
        </Link>
        <button
          onClick={onJoin}
          className={`py-3 px-4 rounded-xl text-center font-medium transition-colors ${
            darkMode 
              ? 'bg-[#2d1b4e] text-[#c4b5fd] hover:bg-[#3d2563] border border-[#4c1d95]' 
              : 'bg-[#f5f3ff] text-[#6d28d9] hover:bg-[#ede9fe] border border-[#c4b5fd]'
          }`}
        >
          🔑 Присоединиться
        </button>
      </div>
    </div>
  )
}