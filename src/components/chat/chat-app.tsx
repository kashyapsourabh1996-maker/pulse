'use client'

import * as React from 'react'
import { MessageCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ChatList } from './chat-list'
import { ChatWindow } from './chat-window'
import { InfoPanel } from './info-panel'
import { NewChatDialog, NewGroupDialog } from './dialogs'
import { StoriesPanel, StoryViewer } from './stories'
import { getSocket, disconnectSocket } from '@/lib/chat/socket'
import type { Conversation, ChatMessage, ChatUser, StoryGroup } from '@/lib/chat/types'

interface ChatAppProps {
  me: ChatUser
  theme: string
  onToggleTheme: () => void
  onLogout: () => void
  onProfileUpdate: () => void
}

export function ChatApp({ me, theme, onToggleTheme, onLogout, onProfileUpdate }: ChatAppProps) {
  const [tab, setTab] = React.useState<'chats' | 'status'>('chats')
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [allUsers, setAllUsers] = React.useState<ChatUser[]>([])
  const [onlineUserIds, setOnlineUserIds] = React.useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = React.useState<Record<string, { name: string }>>({})
  const [storyGroups, setStoryGroups] = React.useState<StoryGroup[]>([])

  // Dialogs / panels
  const [newChatOpen, setNewChatOpen] = React.useState(false)
  const [newGroupOpen, setNewGroupOpen] = React.useState(false)
  const [infoOpen, setInfoOpen] = React.useState(false)
  const [infoTarget, setInfoTarget] = React.useState<Conversation | null>(null)
  const [myProfileOpen, setMyProfileOpen] = React.useState(false)
  const [storyViewer, setStoryViewer] = React.useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  const socketRef = React.useRef<ReturnType<typeof getSocket> | null>(null)
  const activeIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const activeConversation = React.useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  )

  // ---- Data fetching ----
  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) return
      const data = await res.json()
      setAllUsers(data.users)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchStories = React.useCallback(async () => {
    try {
      const res = await fetch('/api/stories')
      if (!res.ok) return
      const data = await res.json()
      setStoryGroups(data.groups)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchMessages = React.useCallback(async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}&take=50`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages)
      // Mark as read
      const patchRes = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
      if (patchRes.ok) {
        const patchData = await patchRes.json()
        const recipientIds = patchData.recipientIds as string[]
        const socket = socketRef.current
        if (socket) {
          socket.emit('read-messages', { conversationId, userId: me.id, recipientIds })
        }
      }
      // Update unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMessages(false)
    }
  }, [me.id])

  // ---- Initial load ----
  React.useEffect(() => {
    fetchConversations()
    fetchUsers()
    fetchStories()
  }, [fetchConversations, fetchUsers, fetchStories])

  // ---- Socket setup ----
  React.useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    const onConnect = () => {
      socket.emit('user-online', { userId: me.id, name: me.name })
    }
    const onOnlineUsers = (data: { users: string[] }) => {
      setOnlineUserIds(new Set(data.users))
    }
    const onPresence = (data: { userId: string; presence: 'online' | 'offline' }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev)
        if (data.presence === 'online') next.add(data.userId)
        else next.delete(data.userId)
        return next
      })
      // Update conversation otherUser presence
      setConversations((prev) =>
        prev.map((c) => {
          if (!c.isGroup && c.otherUser?.id === data.userId) {
            return { ...c, otherUser: { ...c.otherUser, presence: data.presence, lastSeen: data.presence === 'offline' ? new Date().toISOString() : c.otherUser.lastSeen } }
          }
          return c
        })
      )
    }
    const onReceive = (msg: ChatMessage) => {
      // Add to messages if it's the active conversation
      if (msg.conversationId === activeIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Mark read immediately since chat is open
        fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: msg.conversationId }),
        }).then(async (r) => {
          if (r.ok) {
            const d = await r.json()
            socket.emit('read-messages', { conversationId: msg.conversationId, userId: me.id, recipientIds: d.recipientIds })
            socket.emit('message-status', { conversationId: msg.conversationId, messageId: msg.id, status: 'read', recipientIds: d.recipientIds })
          }
        })
      }
      // Update conversation list (last message + unread if not active)
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === msg.conversationId)
        const isActive = msg.conversationId === activeIdRef.current
        const newLast = {
          id: msg.id,
          content: msg.content,
          type: msg.type,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          status: isActive ? 'read' : 'delivered',
        }
        if (exists) {
          return prev
            .map((c) =>
              c.id === msg.conversationId
                ? { ...c, lastMessage: newLast, unreadCount: isActive ? 0 : c.unreadCount + 1 }
                : c
            )
            .sort((a, b) => {
              const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
              const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
              return bt - at
            })
        }
        // New conversation not yet in list — refetch
        fetchConversations()
        return prev
      })
    }
    const onTyping = (data: { conversationId: string; userId: string; name: string }) => {
      if (data.conversationId === activeIdRef.current) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: { name: data.name } }))
      }
    }
    const onStopTyping = (data: { conversationId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const next = { ...prev }
        delete next[data.userId]
        return next
      })
    }
    const onMessagesRead = (data: { conversationId: string; userId: string }) => {
      // The other user read my messages in this conversation
      setMessages((prev) =>
        prev.map((m) => (m.senderId === me.id ? { ...m, status: 'read' } : m))
      )
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId && c.lastMessage && c.lastMessage.senderId === me.id
            ? { ...c, lastMessage: { ...c.lastMessage, status: 'read' } }
            : c
        )
      )
    }
    const onMessageStatus = (data: { conversationId: string; messageId: string; status: string }) => {
      setMessages((prev) => prev.map((m) => (m.id === data.messageId ? { ...m, status: data.status } : m)))
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId && c.lastMessage?.id === data.messageId
            ? { ...c, lastMessage: { ...c.lastMessage, status: data.status } }
            : c
        )
      )
    }

    socket.on('connect', onConnect)
    socket.on('online-users', onOnlineUsers)
    socket.on('presence-update', onPresence)
    socket.on('receive-message', onReceive)
    socket.on('typing', onTyping)
    socket.on('stop-typing', onStopTyping)
    socket.on('messages-read', onMessagesRead)
    socket.on('message-status-update', onMessageStatus)

    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('online-users', onOnlineUsers)
      socket.off('presence-update', onPresence)
      socket.off('receive-message', onReceive)
      socket.off('typing', onTyping)
      socket.off('stop-typing', onStopTyping)
      socket.off('messages-read', onMessagesRead)
      socket.off('message-status-update', onMessageStatus)
    }
  }, [me.id, me.name, fetchConversations])

  // ---- Handlers ----
  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    fetchMessages(id)
  }

  const handleSend = async (content: string, type: string = 'text') => {
    if (!activeId) return
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, content, type }),
      })
      if (!res.ok) return
      const data = await res.json()
      const msg: ChatMessage = data.message
      const recipientIds: string[] = data.recipientIds
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Update conversation last message
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === activeId
              ? { ...c, lastMessage: { id: msg.id, content: msg.content, type: msg.type, senderId: msg.senderId, createdAt: msg.createdAt, status: msg.status } }
              : c
          )
          .sort((a, b) => {
            const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
            const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
            return bt - at
          })
      )
      // Relay via socket
      const socket = socketRef.current
      if (socket) {
        socket.emit('send-message', { conversationId: activeId, message: msg, recipientIds })
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to send message')
    }
  }

  const handleTyping = (typing: boolean) => {
    if (!activeId) return
    const socket = socketRef.current
    if (!socket) return
    const recipientIds = activeConversation?.participants
      .filter((p) => p.userId !== me.id)
      .map((p) => p.userId) ?? []
    if (typing) {
      socket.emit('typing', { conversationId: activeId, userId: me.id, name: me.name, recipientIds, isGroup: activeConversation?.isGroup ?? false })
    } else {
      socket.emit('stop-typing', { conversationId: activeId, userId: me.id, recipientIds })
    }
  }

  const handleStartNewChat = async (user: ChatUser) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [user.id], isGroup: false }),
      })
      if (!res.ok) return
      const data = await res.json()
      await fetchConversations()
      setActiveId(data.conversation.id)
      fetchMessages(data.conversation.id)
      setTab('chats')
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds, isGroup: true, name }),
      })
      if (!res.ok) return
      const data = await res.json()
      await fetchConversations()
      setActiveId(data.conversation.id)
      fetchMessages(data.conversation.id)
      setNewGroupOpen(false)
      setTab('chats')
      toast.success(`Group "${name}" created`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to create group')
    }
  }

  const handleUpdateProfile = async (data: { name?: string; about?: string }) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) return
      toast.success('Profile updated')
      onProfileUpdate()
    } catch (e) {
      console.error(e)
      toast.error('Failed to update profile')
    }
  }

  const handleCreateStory = async (content: string, bgColor: string) => {
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'text', bgColor }),
      })
      if (!res.ok) return
      toast.success('Status updated!')
      fetchStories()
    } catch (e) {
      console.error(e)
      toast.error('Failed to post status')
    }
  }

  const handleViewStory = async (storyId: string) => {
    try {
      await fetch('/api/stories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      })
      fetchStories()
    } catch (e) {
      console.error(e)
    }
  }

  const handleCallToast = (kind: 'voice' | 'video') => {
    const name = activeConversation
      ? activeConversation.isGroup
        ? activeConversation.name
        : activeConversation.otherUser?.name
      : ''
    if (kind === 'video') {
      toast(`Starting video call with ${name}...`, { description: 'Video calling is a demo feature 📹' })
    } else {
      toast(`Calling ${name}...`, { description: 'Voice calling is a demo feature 📞' })
    }
  }

  const openInfo = () => {
    if (activeConversation) {
      setInfoTarget(activeConversation)
      setInfoOpen(true)
    }
  }

  const myStoryExists = storyGroups.some((g) => g.user.id === me.id)

  return (
    <div className="h-screen w-full flex bg-[#d1d7db] dark:bg-[#0b141a] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          activeId ? 'hidden md:flex' : 'flex'
        } md:w-[400px] lg:w-[420px] xl:w-[440px] w-full flex-col shrink-0 border-r border-[#d1d7db] dark:border-[#222e35]`}
      >
        {tab === 'chats' ? (
          <ChatList
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelectConversation}
            onNewChat={() => setNewChatOpen(true)}
            onNewGroup={() => setNewGroupOpen(true)}
            onOpenProfile={() => setMyProfileOpen(true)}
            me={me}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : (
          <StoriesPanel
            groups={storyGroups}
            meName={me.name}
            meAvatar={me.avatar}
            hasMyStory={myStoryExists}
            onOpenViewer={(idx) => setStoryViewer({ open: true, index: idx })}
            onCreateStory={handleCreateStory}
          />
        )}

        {/* Bottom tab bar */}
        <div className="flex items-center justify-around bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#e9edef] dark:border-[#222e35] py-1.5 shrink-0">
          <button
            onClick={() => setTab('chats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'chats'
                ? 'bg-[#25d366] text-white'
                : 'text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <MessageCircle className="w-5 h-5" /> Chats
          </button>
          <button
            onClick={() => setTab('status')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'status'
                ? 'bg-[#25d366] text-white'
                : 'text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <Plus className="w-5 h-5" /> Status
          </button>
        </div>
      </div>

      {/* Main panel */}
      <div className={`flex-1 ${activeId ? 'flex' : 'hidden md:flex'} min-w-0`}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            me={me}
            typingUser={typingUsers[Object.keys(typingUsers)[0] ?? ''] ?? null}
            onBack={() => setActiveId(null)}
            onSend={handleSend}
            onTyping={handleTyping}
            onOpenInfo={openInfo}
            onCallToast={handleCallToast}
            onlineUserIds={onlineUserIds}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#222e35] text-center px-6">
            <div className="w-80 h-80 rounded-full bg-[#25d366]/10 flex items-center justify-center mb-6">
              <MessageCircle className="w-32 h-32 text-[#25d366]/40" strokeWidth={1} />
            </div>
            <h2 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-3">ZappChat Web</h2>
            <p className="text-sm text-[#667781] dark:text-[#8696a0] max-w-md leading-relaxed">
              Send and receive messages without keeping your phone online. Select a chat from the left to start messaging, or create a new conversation.
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs text-[#667781] dark:text-[#8696a0]">
              <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs & panels */}
      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        users={allUsers}
        onSelect={handleStartNewChat}
      />
      <NewGroupDialog
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        users={allUsers}
        onCreate={handleCreateGroup}
      />
      <InfoPanel
        open={infoOpen || myProfileOpen}
        onClose={() => {
          setInfoOpen(false)
          setMyProfileOpen(false)
        }}
        conversation={myProfileOpen ? null : infoTarget}
        me={me}
        onlineUserIds={onlineUserIds}
        onCallToast={handleCallToast}
        onUpdateProfile={handleUpdateProfile}
      />
      {storyViewer.open && (
        <StoryViewer
          groups={storyGroups}
          startGroup={storyViewer.index}
          onClose={() => setStoryViewer({ open: false, index: 0 })}
          onView={handleViewStory}
        />
      )}
    </div>
  )
}
