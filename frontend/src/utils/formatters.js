// C:\OSPanel\domains\karny\frontend\src\utils\formatters.js

export function formatEventDate(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const dateStr2 = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  
  if (date.toDateString() === today.toDateString()) return `Сегодня, ${timeStr}`
  if (date.toDateString() === tomorrow.toDateString()) return `Завтра, ${timeStr}`
  return `${dateStr2}, ${timeStr}`
}