// C:\OSPanel\domains\karny\frontend\src\components\common\EmptyState.jsx

export default function EmptyState({ 
  icon = '📭', 
  title = 'Нет данных', 
  description = 'Здесь пока ничего нет',
  actionText = null,
  onAction = null,
  darkMode = false
}) {
  return (
    <div className={`py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
      <div className="text-5xl mb-4 opacity-50">{icon}</div>
      <p className={`font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {title}
      </p>
      <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`mt-4 text-sm font-medium ${
            darkMode 
              ? 'text-[#a78bfa] hover:text-[#c4b5fd]' 
              : 'text-[#8b5cf6] hover:text-[#6d28d9]'
          } transition-colors`}
        >
          {actionText}
        </button>
      )}
    </div>
  )
}