// C:\OSPanel\domains\karny\frontend\src\components\room\chat\SystemMessage.jsx

export default function SystemMessage({ content, darkMode }) {
  return (
    <div className="flex justify-center my-2">
      <span className={`text-xs px-3 py-1 rounded-full ${
        darkMode ? 'bg-[#2a2a30] text-gray-400' : 'bg-white/60 text-gray-500'
      }`}>
        {content}
      </span>
    </div>
  )
}