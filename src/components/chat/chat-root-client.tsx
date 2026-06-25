'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ChatApp } from './chat-app'
import type { ChatUser } from '@/lib/chat/types'

export function ChatRootClient({ me }: { me: ChatUser }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.refresh()
  }

  const handleProfileUpdate = () => {
    router.refresh()
  }

  // Avoid hydration mismatch for theme
  const currentTheme = mounted ? (theme ?? 'light') : 'light'

  return (
    <ChatApp
      me={me}
      theme={currentTheme}
      onToggleTheme={toggleTheme}
      onLogout={handleLogout}
      onProfileUpdate={handleProfileUpdate}
    />
  )
}
