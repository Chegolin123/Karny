// C:\OSPanel\domains\karny\frontend\src\components\room\Toast.jsx

export default function Toast({ message, show }) {
  if (!show) return null
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
      <div className="bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-sm font-medium shadow-lg flex items-center justify-center">
        <span className="leading-none">{message}</span>
      </div>
    </div>
  )
}