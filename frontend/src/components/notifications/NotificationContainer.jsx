// C:\OSPanel\domains\karny\frontend\src\components\notifications\NotificationContainer.jsx

import { useNotification } from '../../contexts/NotificationContext'
import NotificationToast from './NotificationToast'
import { useTheme } from '../common/ThemeProvider'

export default function NotificationContainer() {
  const { notifications } = useNotification()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] pointer-events-none">
      <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  )
}