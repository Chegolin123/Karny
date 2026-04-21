// C:\OSPanel\domains\karny\frontend\src\components\common\ErrorMessage.jsx

import { Link } from 'react-router-dom'

export default function ErrorMessage({ message, backLink = '/' }) {
  return (
    <div className="min-h-screen bg-[#fafafa] p-5">
      <div className="max-w-2xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {message}
        </div>
        <Link to={backLink} className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-700">
          ← На главную
        </Link>
      </div>
    </div>
  )
}