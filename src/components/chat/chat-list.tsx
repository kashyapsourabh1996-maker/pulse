'use client'

import * as React from 'react'
import { Search, MoreVertical, MessageSquarePlus, Users, Circle, LogOut, Moon, Sun, X } from 'lucide-react'
import { Avatar } from './avatar'
import { MessageTicks } from './ticks'
import { formatChatListTime } from '@/lib/chat/format'
import type { Conversation, ChatUser } from '@/lib/chat/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface ChatListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onNewGroup: () => void
  onOpenProfile: () => void
  me: ChatUser | null
  theme: string
  onToggleTheme: () => void
  onLogout: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function ChatList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onNewGroup,
  onOpenProfile,
  me,
  theme,
  onToggleTheme,
  onLogout,
  searchQuery,
  onSearchChange,
}: ChatListProps) {
  const [searchFocused, setSearchFocused] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const name = c.isGroup ? c.name : c.otherUser?.name
      return name?.toLowerCase().includes(q)
    })
  }, [conversations, searchQuery])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
        <div className="flex items-center gap-2">
          <img src="/pulse-logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="text-lg font-semibold text-[#111b21] dark:text-[#e9edef]">Pulse</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewGroup}
            title="New group"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="Menu"
                className="w-10 h-10 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onNewGroup}>
                <Users className="w-4 h-4 mr-2" /> New group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenProfile}>
                <MessageSquarePlus className="w-4 h-4 mr-2" /> My profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white dark:bg-[#111b21] shrink-0">
        <div
          className={`flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] transition ${
            searchFocused ? 'ring-2 ring-[#B91C1C]' : ''
          }`}
        >
          {searchFocused ? (
            <X
              className="w-4 h-4 text-[#54656f] dark:text-[#8696a0] cursor-pointer"
              onClick={() => {
                onSearchChange('')
                setSearchFocused(false)
              }}
            />
          ) : (
            <Search className="w-4 h-4 text-[#54656f] dark:text-[#8696a0]" />
          )}
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search or start a new chat"
            className="flex-1 bg-transparent outline-none text-sm text-[#111b21] dark:text-[#e9edef] placeholder:text-[#8696a0]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto wa-scroll">
        {/* Me card at top */}
        {me && (
          <button
            onClick={onOpenProfile}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition border-b border-[#e9edef] dark:border-[#222e35] text-left"
          >
            <Avatar name={me.name} src={me.avatar} size={48} online />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">{me.name} (You)</div>
              <div className="text-xs text-[#B91C1C] truncate">{me.about}</div>
            </div>
            <Circle className="w-2 h-2 fill-[#B91C1C] text-[#B91C1C]" />
          </button>
        )}

        {/* New chat button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition text-left"
        >
          <div className="w-12 h-12 rounded-full bg-[#B91C1C] flex items-center justify-center shrink-0">
            <MessageSquarePlus className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[#111b21] dark:text-[#e9edef]">New chat</div>
            <div className="text-xs text-[#667781] dark:text-[#8696a0] truncate">Start a new conversation</div>
          </div>
        </button>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[#667781] dark:text-[#8696a0]">
            {searchQuery ? 'No chats found' : 'No conversations yet. Start a new chat!'}
          </div>
        ) : (
          filtered.map((c) => {
            const name = c.isGroup ? c.name ?? 'Group' : c.otherUser?.name ?? 'Unknown'
            const avatar = c.isGroup ? c.avatar : c.otherUser?.avatar ?? null
            const online = !c.isGroup && c.otherUser?.presence === 'online'
            const last = c.lastMessage
            const lastText =
              last
                ? last.type === 'image'
                  ? '📷 Photo'
                  : last.type === 'audio'
                  ? '🎤 Voice message'
                  : last.type === 'file'
                  ? '📎 File'
                  : last.content
                : 'Tap to start chatting'
            const isMine = last && last.senderId === me?.id
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition text-left border-b border-[#f0f2f5] dark:border-[#1d282f] ${
                  activeId === c.id
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
                }`}
              >
                <Avatar name={name} src={avatar} size={48} online={online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">{name}</span>
                    {last && (
                      <span
                        className={`text-xs shrink-0 ${
                          c.unreadCount > 0 ? 'text-[#B91C1C] font-semibold' : 'text-[#667781] dark:text-[#8696a0]'
                        }`}
                      >
                        {formatChatListTime(last.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-sm text-[#667781] dark:text-[#8696a0] truncate flex items-center gap-1">
                      {isMine && last && <MessageTicks status={last.status} />}
                      <span className="truncate">{lastText}</span>
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#B91C1C] text-white text-xs font-semibold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
