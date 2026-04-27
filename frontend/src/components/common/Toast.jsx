// C:\OSPanel\domains\karny\frontend\src\components\common\Toast.jsx

export default function Toast({ message, show }) {
  if (!show) return null
  
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div className="animate-fadeIn pointer-events-auto">
        <div className="bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg">
          <span className="text-sm font-medium whitespace-nowrap">{message}</span>
        </div>
      </div>
    </div>
  )
}