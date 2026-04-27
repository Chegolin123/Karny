// C:\OSPanel\domains\karny\frontend\src\components\ApiTest.jsx

import { useState } from 'react'
import * as api from '../api'

export default function ApiTest() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="font-semibold mb-3">🧪 Тест API</h3>
      
      <button
        onClick={testHealth}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Загрузка...' : 'Проверить /api/health'}
      </button>
      
      {result && (
        <pre className="mt-3 p-3 bg-gray-100 rounded text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
      
      {error && (
        <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
          ❌ {error}
        </div>
      )}
    </div>
  )
}