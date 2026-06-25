'use client'

import * as React from 'react'
import {
  ArrowLeft, Phone, Video, Search, MoreVertical, Paperclip, Mic, Send, Smile, Camera, X, Check, CheckCheck,
} from 'lucide-react'
import { Avatar } from './avatar'
import { MessageTicks } from './ticks'
import { EmojiPicker } from './emoji-picker'
import { formatTime, formatDateSeparator, formatLastSeen, sameDay } from '@/lib/chat/format'
import type { Conversation, ChatMessage, ChatUser } from '@/lib/chat/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatWindowProps {
  conversation: Conversation
  messages: ChatMessage[]
  me: ChatUser
  typingUser: { name: string } | null
  onBack: () => void
  onSend: (content: string, type?: string) => void
  onTyping: (typing: boolean) => void
  onOpenInfo: () => void
  onCallToast: (kind: 'voice' | 'video') => void
  onlineUserIds: Set<string>
}

export function ChatWindow({
  conversation,
  messages,
  me,
  typingUser,
  onBack,
  onSend,
  onTyping,
  onOpenInfo,
  onCallToast,
  onlineUserIds,
}: ChatWindowProps) {
  const [input, setInput] = React.useState('')
  const [showEmoji, setShowEmoji] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const typingTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const name = conversation.isGroup ? conversation.name ?? 'Group' : conversation.otherUser?.name ?? 'Unknown'
  const avatar = conversation.isGroup ? conversation.avatar : conversation.otherUser?.avatar ?? null

  const presenceText = React.useMemo(() => {
    if (conversation.isGroup) {
      const online = conversation.participants.filter((p) => onlineUserIds.has(p.userId)).length
      return `${conversation.participants.length} members${online > 1 ? ` · ${online} online` : ''}`
    }
    const other = conversation.otherUser
    if (!other) return ''
    if (onlineUserIds.has(other.id)) return 'online'
    return formatLastSeen(other.lastSeen)
  }, [conversation, onlineUserIds])

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typingUser])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSend(text, 'text')
    setInput('')
    onTyping(false)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    inputRef.current?.focus()
  }

  const handleInput = (val: string) => {
    setInput(val)
    onTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onTyping(false), 2000)
  }

  // Group messages by day
  const grouped = React.useMemo(() => {
    const groups: Array<{ date: string; items: ChatMessage[] }> = []
    for (const m of messages) {
      const key = new Date(m.createdAt).toDateString()
      const last = groups[groups.length - 1]
      if (last && last.date === key) last.items.push(m)
      else groups.push({ date: key, items: [m] })
    }
    return groups
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0b141a] min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0 z-10">
        <button
          onClick={onBack}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={onOpenInfo} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Avatar name={name} src={avatar} size={40} online={!conversation.isGroup && onlineUserIds.has(conversation.otherUser?.id ?? '')} />
          <div className="min-w-0">
            <div className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">{name}</div>
            <div className="text-xs text-[#667781] dark:text-[#8696a0] truncate">
              {typingUser ? <span className="text-[#B91C1C]">typing...</span> : presenceText}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCallToast('video')}
            title="Video call"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => onCallToast('voice')}
            title="Voice call"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Phone className="w-5 h-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/10">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onOpenInfo}>Contact info</DropdownMenuItem>
              <DropdownMenuItem>Select messages</DropdownMenuItem>
              <DropdownMenuItem>Close chat</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto wa-scroll wa-chat-bg px-3 md:px-12 py-4">
        <div className="max-w-3xl mx-auto space-y-1">
          {/* Encryption notice */}
          <div className="flex justify-center mb-3">
            <div className="text-xs text-[#667781] dark:text-[#cbd5d8] bg-[#fff3c4] dark:bg-[#182229] px-3 py-2 rounded-lg text-center max-w-md shadow-sm">
              🔒 Messages are end-to-end encrypted. No one outside of this chat can read them.
            </div>
          </div>

          {grouped.map((group) => (
            <div key={group.date} className="space-y-1">
              <div className="flex justify-center my-3">
                <span className="text-xs text-[#54656f] dark:text-[#8696a0] bg-white dark:bg-[#182229] px-3 py-1 rounded-lg shadow-sm font-medium">
                  {formatDateSeparator(group.date)}
                </span>
              </div>
              {group.items.map((m, idx) => {
                const mine = m.senderId === me.id
                const prev = group.items[idx - 1]
                const showSender = conversation.isGroup && !mine && (!prev || prev.senderId !== m.senderId)
                const isFirstOfDay = idx === 0
                const tailClass = mine ? 'bubble-out' : 'bubble-in'
                const showTail = !prev || prev.senderId !== m.senderId || !sameDay(prev.createdAt, m.createdAt)
                return (
                  <div
                    key={m.id}
                    className={`flex wa-fade-in ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative max-w-[75%] md:max-w-[65%] px-2.5 py-1.5 rounded-lg shadow-sm ${
                        mine
                          ? 'bg-[#fee2e2] dark:bg-[#651010] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
                          : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
                      } ${showTail ? tailClass : ''}`}
                      style={{ marginLeft: mine ? 0 : 8, marginRight: mine ? 8 : 0 }}
                    >
                      {showSender && (
                        <div className="text-xs font-semibold mb-0.5" style={{ color: '#e542a3' }}>
                          {m.sender?.name}
                        </div>
                      )}
                      <div className="flex items-end gap-2 flex-wrap">
                        <span className="text-sm whitespace-pre-wrap break-words leading-relaxed pr-1">
                          {m.type === 'image' ? (
                            <span>
                              <span className="block">📷 Photo</span>
                              {m.content && <span className="block mt-1">{m.content}</span>}
                            </span>
                          ) : m.type === 'audio' ? (
                            <span className="flex items-center gap-2">
                              <Mic className="w-4 h-4" /> Voice message
                            </span>
                          ) : m.type === 'file' ? (
                            <span className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4" /> {m.content}
                            </span>
                          ) : (
                            m.content
                          )}
                        </span>
                        <span className="text-[10px] text-[#667781] dark:text-[#8696a0] ml-auto flex items-center gap-1 shrink-0 self-end">
                          {formatTime(m.createdAt)}
                          {mine && <MessageTicks status={m.status} />}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex justify-start wa-fade-in">
              <div className="bg-white dark:bg-[#202c33] px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8696a0] wa-typing-dot" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#8696a0] wa-typing-dot" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#8696a0] wa-typing-dot" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex justify-center mt-10">
              <div className="text-center text-sm text-[#667781] dark:text-[#8696a0] max-w-xs">
                <p className="mb-1">No messages yet.</p>
                <p>Say hi to {name}! 👋</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="relative">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className="w-10 h-10 flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-[#e9edef] transition rounded-full"
              aria-label="Emoji"
            >
              <Smile className="w-6 h-6" />
            </button>
            {showEmoji && (
              <EmojiPicker
                onPick={(e) => {
                  setInput((v) => v + e)
                  inputRef.current?.focus()
                }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-[#e9edef] transition rounded-full"
            aria-label="Attach"
            onClick={() => onSend('📷 Shared a photo', 'image')}
          >
            <Paperclip className="w-6 h-6 -rotate-45" />
          </button>
          <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg px-3 py-2 flex items-center">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type a message"
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-[#111b21] dark:text-[#e9edef] placeholder:text-[#8696a0] max-h-24 wa-scroll"
              style={{ minHeight: 24 }}
            />
          </div>
          {input.trim() ? (
            <button
              onClick={handleSend}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-[#B91C1C] hover:bg-[#991111] transition shadow-md"
              aria-label="Send"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={() => onSend('🎤 Voice message', 'audio')}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-[#B91C1C] hover:bg-[#991111] transition shadow-md"
              aria-label="Voice message"
            >
              <Mic className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
