import { getCurrentUser } from '@/lib/chat/session'
import { LoginScreen } from '@/components/chat/login-screen'
import { ChatRootClient } from '@/components/chat/chat-root-client'

// Force dynamic so cookie-based session is always fresh
export const dynamic = 'force-dynamic'

export default async function Home() {
  const me = await getCurrentUser()

  if (!me) {
    return <LoginScreen />
  }

  // Pass a plain object (no Date instances) to the client component
  const mePlain = {
    id: me.id,
    name: me.name,
    phone: me.phone,
    avatar: me.avatar,
    about: me.about,
    presence: me.presence as 'online' | 'offline',
    lastSeen: me.lastSeen ? me.lastSeen.toISOString() : null,
  }

  return <ChatRootClient me={mePlain} />
}
