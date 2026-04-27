// C:\OSPanel\domains\karny\frontend\src\utils\avatar.js

export function getAvatarColor(name) {
  if (!name) return '#6d28d9'
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}

export function getAvatarGradient(name) {
  if (!name) return 'linear-gradient(135deg, #6d28d9, #8b5cf6)'
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 40) % 360
  
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 80%, 45%))`
}

/**
 * Получить инициалы из имени и фамилии
 * @param {string} firstName - Имя
 * @param {string} lastName - Фамилия (опционально)
 * @returns {string} - Инициалы (1-2 символа)
 */
export function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return '?'
  
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  
  // Если есть оба — возвращаем оба инициала
  if (first && last) return first + last
  
  // Если только имя — возвращаем первые две буквы или одну
  if (first && !last) {
    return firstName.length >= 2 
      ? firstName.slice(0, 2).toUpperCase() 
      : first
  }
  
  // Если только фамилия
  if (!first && last) {
    return lastName.length >= 2 
      ? lastName.slice(0, 2).toUpperCase() 
      : last
  }
  
  return '?'
}