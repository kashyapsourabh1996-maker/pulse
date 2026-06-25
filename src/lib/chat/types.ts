// Shared chat types used across the frontend

export interface ChatUser {
  id: string
  name: string
  phone: string
  avatar: string | null
  about: string
  presence: 'online' | 'offline'
  lastSeen: string | null
}

export interface Conversation {
  id: string
  name: string | null
  avatar: string | null
  isGroup: boolean
  about: string | null
  participants: Array<{
    userId: string
    name: string
    phone: string
    avatar: string | null
    about: string
    presence: string
    lastSeen: string | null
  }>
  otherUser: ChatUser | null
  lastMessage: {
    id: string
    content: string
    type: string
    senderId: string
    createdAt: string
    status: string
  } | null
  lastReadAt: string | null
  unreadCount: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  sender: { id: string; name: string; avatar: string | null }
  content: string
  type: string
  mediaUrl: string | null
  status: string
  createdAt: string
}

export interface StoryGroup {
  user: { id: string; name: string; avatar: string | null }
  stories: Array<{
    id: string
    content: string
    type: string
    bgColor: string | null
    mediaUrl: string | null
    createdAt: string
    expiresAt: string
    viewedByMe: boolean
  }>
}
