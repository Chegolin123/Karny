// C:\OSPanel\domains\karny\frontend\src\components\home\ActionButtons.jsx

export default function ActionButtons({ onCreate, onJoin, darkMode }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <button
        onClick={onCreate}
        className={`py-4 px-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg ${
          darkMode
            ? 'bg-[#1a1a1e] text-white border-2 border-[#3f3f46] hover:bg-[#2a2a30] hover:border-[#52525b]'
            : 'bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">✨</span>
          <span>Новая комната</span>
        </div>
      </button>
      
      <button
        onClick={onJoin}
        className={`py-4 px-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg ${
          darkMode
            ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white hover:from-[#7c3aed] hover:to-[#a78bfa] border-0'
            : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] text-white hover:from-[#5b21b6] hover:to-[#7c3aed] border-0'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">🔑</span>
          <span>Присоединиться</span>
        </div>
      </button>
    </div>
  )
}