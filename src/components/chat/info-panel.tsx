'use client'

import * as React from 'react'
import { X, Star, Bell, Trash2, Ban, Phone, Video, Camera, Edit3, Check, Search } from 'lucide-react'
import { Avatar } from './avatar'
import { formatLastSeen } from '@/lib/chat/format'
import type { Conversation, ChatUser } from '@/lib/chat/types'

interface InfoPanelProps {
  open: boolean
  onClose: () => void
  conversation: Conversation | null
  me: ChatUser | null
  onlineUserIds: Set<string>
  onCallToast: (kind: 'voice' | 'video') => void
  onUpdateProfile: (data: { name?: string; about?: string }) => Promise<void>
}

export function InfoPanel({
  open,
  onClose,
  conversation,
  me,
  onlineUserIds,
  onCallToast,
  onUpdateProfile,
}: InfoPanelProps) {
  const [editingName, setEditingName] = React.useState(false)
  const [editingAbout, setEditingAbout] = React.useState(false)
  const [nameVal, setNameVal] = React.useState('')
  const [aboutVal, setAboutVal] = React.useState('')

  // Is this the "my profile" panel?
  const isMyProfile = !conversation && !!me

  React.useEffect(() => {
    if (open) {
      setEditingName(false)
      setEditingAbout(false)
      if (me) {
        setNameVal(me.name)
        setAboutVal(me.about)
      }
    }
  }, [open, me])

  if (!open) return null

  const display = isMyProfile
    ? me!
    : conversation!.isGroup
    ? { id: conversation!.id, name: conversation!.name ?? 'Group', phone: '', avatar: conversation!.avatar, about: conversation!.about ?? '', presence: 'offline', lastSeen: null }
    : conversation!.otherUser ?? { id: '', name: 'Unknown', phone: '', avatar: null, about: '', presence: 'offline', lastSeen: null }

  const isOnline = !isMyProfile && !conversation!.isGroup && onlineUserIds.has(display.id)
  const subtitle = isMyProfile
    ? me!.phone
    : conversation!.isGroup
    ? `Group · ${conversation!.participants.length} participants`
    : isOnline
    ? 'online'
    : formatLastSeen(display.lastSeen)

  const saveName = async () => {
    if (nameVal.trim() && nameVal !== me?.name) {
      await onUpdateProfile({ name: nameVal.trim() })
    }
    setEditingName(false)
  }
  const saveAbout = async () => {
    if (aboutVal !== me?.about) {
      await onUpdateProfile({ about: aboutVal })
    }
    setEditingAbout(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 wa-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#111b21] w-full max-w-md h-full ml-auto shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#7f1d1d] dark:bg-[#651010] text-white px-4 py-4 flex items-center gap-4 shrink-0">
          <button onClick={onClose} className="hover:opacity-80">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-medium">{isMyProfile ? 'Profile info' : 'Contact info'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto wa-scroll">
          {/* Avatar + name */}
          <div className="flex flex-col items-center py-8 bg-[#f0f2f5] dark:bg-[#111b21]">
            <div className="relative">
              <Avatar name={display.name} src={display.avatar} size={180} />
              {isMyProfile && (
                <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#7f1d1d] flex items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
            <div className="mt-4 text-center px-4 w-full">
              {isMyProfile && editingName ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    className="text-2xl font-medium bg-transparent border-b-2 border-[#7f1d1d] text-[#111b21] dark:text-[#e9edef] outline-none text-center"
                    autoFocus
                  />
                  <button onClick={saveName} className="text-[#7f1d1d]">
                    <Check className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-2xl font-medium text-[#111b21] dark:text-[#e9edef]">{display.name}</h3>
                  {isMyProfile && (
                    <button onClick={() => setEditingName(true)} className="text-[#667781] hover:text-[#7f1d1d]">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-sm text-[#667781] dark:text-[#8696a0] mt-1">{subtitle}</p>
            </div>
          </div>

          {/* About */}
          <div className="px-6 py-5 border-b border-[#e9edef] dark:border-[#222e35]">
            <p className="text-xs text-[#667781] dark:text-[#8696a0] mb-2">About</p>
            {isMyProfile && editingAbout ? (
              <div className="flex items-center gap-2">
                <input
                  value={aboutVal}
                  onChange={(e) => setAboutVal(e.target.value)}
                  className="flex-1 text-sm bg-transparent border-b-2 border-[#7f1d1d] text-[#111b21] dark:text-[#e9edef] outline-none py-1"
                  autoFocus
                  maxLength={139}
                />
                <button onClick={saveAbout} className="text-[#7f1d1d]">
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[#111b21] dark:text-[#e9edef]">{display.about || 'Hey there! I am using WhatsApp.'}</p>
                {isMyProfile && (
                  <button onClick={() => setEditingAbout(true)} className="text-[#667781] hover:text-[#7f1d1d] shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick actions */}
          {!isMyProfile && (
            <div className="flex justify-around py-4 border-b border-[#e9edef] dark:border-[#222e35]">
              <button
                onClick={() => onCallToast('voice')}
                className="flex flex-col items-center gap-1 text-[#7f1d1d] dark:text-[#B91C1C] hover:opacity-80"
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">Call</span>
              </button>
              <button
                onClick={() => onCallToast('video')}
                className="flex flex-col items-center gap-1 text-[#7f1d1d] dark:text-[#B91C1C] hover:opacity-80"
              >
                <Video className="w-5 h-5" />
                <span className="text-xs">Video</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-[#7f1d1d] dark:text-[#B91C1C] hover:opacity-80">
                <Search className="w-5 h-5" />
                <span className="text-xs">Search</span>
              </button>
            </div>
          )}

          {/* Group participants */}
          {conversation && conversation.isGroup && (
            <div className="py-3">
              <p className="px-6 py-2 text-xs text-[#667781] dark:text-[#8696a0]">{conversation.participants.length} participants</p>
              {conversation.participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-3 px-6 py-2 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]">
                  <Avatar name={p.name} src={p.avatar} size={40} online={onlineUserIds.has(p.userId)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#111b21] dark:text-[#e9edef] truncate">
                      {p.userId === me?.id ? 'You' : p.name}
                    </div>
                    <div className="text-xs text-[#667781] dark:text-[#8696a0] truncate">{p.about}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings list */}
          <div className="py-2">
            <button className="w-full flex items-center gap-4 px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] text-left">
              <Star className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
              <span className="text-sm text-[#111b21] dark:text-[#e9edef]">Starred messages</span>
            </button>
            <button className="w-full flex items-center gap-4 px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] text-left">
              <Bell className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
              <span className="text-sm text-[#111b21] dark:text-[#e9edef]">Mute notifications</span>
            </button>
            {!isMyProfile && (
              <>
                <button className="w-full flex items-center gap-4 px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] text-left">
                  <Ban className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                  <span className="text-sm text-[#111b21] dark:text-[#e9edef]">Block {display.name}</span>
                </button>
                <button className="w-full flex items-center gap-4 px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] text-left text-red-600">
                  <Trash2 className="w-5 h-5" />
                  <span className="text-sm">Delete chat</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
