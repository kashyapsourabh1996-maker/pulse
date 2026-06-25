// Time/date formatting helpers (India-friendly)

export function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatChatListTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return formatTime(d)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' })
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatDateSeparator(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatLastSeen(date: Date | string | null) {
  if (!date) return 'offline'
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = formatTime(d)
  if (sameDay) return `last seen today at ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `last seen yesterday at ${time}`
  return `last seen ${d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })} at ${time}`
}

export function sameDay(a: Date | string, b: Date | string) {
  const da = typeof a === 'string' ? new Date(a) : a
  const db = typeof b === 'string' ? new Date(b) : b
  return da.toDateString() === db.toDateString()
}
