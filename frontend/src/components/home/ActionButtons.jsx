// C:\OSPanel\domains\karny\frontend\src\components\home\ActionButtons.jsx

export default function ActionButtons({ onCreate, onJoin }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      <button
        onClick={onCreate}
        className="py-3 px-4 bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:border-[#8b5cf6] hover:bg-[#f5f3ff] transition-all"
      >
        Новая комната
      </button>
      <button
        onClick={onJoin}
        className="py-3 px-4 bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] text-white text-sm font-medium rounded-lg hover:from-[#6d28d9] hover:to-[#7c3aed] transition-all shadow-sm hover:shadow-md"
      >
        Присоединиться
      </button>
    </div>
  )
}