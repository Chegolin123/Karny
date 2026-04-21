// C:\OSPanel\domains\karny\frontend\src\utils\avatar.js

export function getInitials(firstName, lastName) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
  if (firstName) return firstName[0].toUpperCase()
  return ''
}

export function getAvatarColor(name) {
  if (!name) return '#8b5cf6'
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
    '#a78bfa', '#c084fc', '#d8b4fe', '#e9d5ff'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}