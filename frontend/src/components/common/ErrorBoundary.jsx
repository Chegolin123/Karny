// C:\OSPanel\domains\karny\frontend\src\components\common\ErrorBoundary.jsx

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary caught error:', error, errorInfo)
    
    // Увеличиваем счётчик ошибок
    this.setState(prev => ({ 
      errorInfo,
      errorCount: prev.errorCount + 1 
    }))
    
    // Если ошибок больше 3 — предлагаем перезагрузить
    if (this.state.errorCount >= 3) {
      setTimeout(() => {
        if (window.confirm('Приложение работает нестабильно. Перезагрузить?')) {
          window.location.reload()
        }
      }, 100)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0f0f13] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1a1e] rounded-2xl shadow-xl p-6 text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Произошла ошибка при загрузке страницы.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                  Техническая информация
                </summary>
                <pre className="text-xs bg-gray-100 dark:bg-[#2a2a30] p-3 rounded-lg overflow-auto max-h-40">
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-[#2a2a30] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#3f3f46] transition-colors"
              >
                На главную
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] text-white rounded-xl font-medium hover:from-[#5b21b6] hover:to-[#7c3aed] transition-colors"
              >
                Обновить
              </button>
            </div>
            
            {this.state.errorCount > 1 && (
              <button
                onClick={this.handleRetry}
                className="mt-3 text-sm text-[#8b5cf6] hover:underline"
              >
                Попробовать снова
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}