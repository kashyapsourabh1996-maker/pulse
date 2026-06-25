'use client'

import * as React from 'react'

// Deterministic color from a string (for avatar backgrounds)
const AVATAR_COLORS = [
  '#dfe5e7', '#ff9a8b', '#a085ee', '#f7c873', '#7ee0c4',
  '#f3a3c0', '#9ad0f5', '#c4e88d', '#ffb59e', '#bda8ff',
]

export function colorFromString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  className?: string
  online?: boolean
}

export function Avatar({ name, src, size = 40, className = '', online = false }: AvatarProps) {
  const bg = colorFromString(name || '?')
  const fontSize = Math.max(12, Math.floor(size * 0.4))
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-medium text-white select-none"
          style={{ backgroundColor: bg, fontSize }}
        >
          {initials(name)}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full border-2 border-white dark:border-[#111b21] bg-[#B91C1C]"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  )
}
