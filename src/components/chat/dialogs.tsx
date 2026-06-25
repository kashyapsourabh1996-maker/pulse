'use client'

import * as React from 'react'
import { Search, X, Check, ArrowLeft, Camera } from 'lucide-react'
import { Avatar } from './avatar'
import type { ChatUser } from '@/lib/chat/types'

interface NewChatDialogProps {
  open: boolean
  onClose: () => void
  users: ChatUser[]
  onSelect: (user: ChatUser) => void
}

export function NewChatDialog({ open, onClose, users, onSelect }: NewChatDialogProps) {
  const [q, setQ] = React.useState('')
  React.useEffect(() => {
    if (open) setQ('')
  }, [open])

  if (!open) return null
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.phone.includes(q)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 wa-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#111b21] rounded-lg shadow-2xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#008069] dark:bg-[#005c4b] text-white px-4 py-4 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={onClose} className="hover:opacity-80">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-medium">New chat</h2>
          </div>
          <div className="flex items-center gap-3 bg-white/20 rounded-lg px-3 py-2">
            <Search className="w-4 h-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or number"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/70"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto wa-scroll">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[#667781] dark:text-[#8696a0]">
              No contacts found
            </div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onSelect(u)
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition text-left border-b border-[#f0f2f5] dark:border-[#1d282f]"
              >
                <Avatar name={u.name} src={u.avatar} size={48} online={u.presence === 'online'} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">{u.name}</div>
                  <div className="text-xs text-[#667781] dark:text-[#8696a0] truncate">{u.about}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface NewGroupDialogProps {
  open: boolean
  onClose: () => void
  users: ChatUser[]
  onCreate: (name: string, participantIds: string[]) => void
}

export function NewGroupDialog({ open, onClose, users, onCreate }: NewGroupDialogProps) {
  const [step, setStep] = React.useState<'select' | 'name'>('select')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [q, setQ] = React.useState('')
  const [groupName, setGroupName] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setStep('select')
      setSelected(new Set())
      setQ('')
      setGroupName('')
    }
  }, [open])

  if (!open) return null
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.phone.includes(q)
  )
  const selectedUsers = users.filter((u) => selected.has(u.id))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 wa-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#111b21] rounded-lg shadow-2xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'select' ? (
          <>
            <div className="bg-[#008069] dark:bg-[#005c4b] text-white px-4 py-4 shrink-0">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={onClose} className="hover:opacity-80">
                  <X className="w-6 h-6" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-medium">New group</h2>
                  <p className="text-xs text-white/80">{selected.size} participants selected</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/20 rounded-lg px-3 py-2">
                <Search className="w-4 h-4" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search contacts"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/70"
                  autoFocus
                />
              </div>
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex gap-2 px-4 py-3 overflow-x-auto wa-scroll bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
                {selectedUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    className="flex flex-col items-center gap-1 shrink-0 w-16"
                  >
                    <div className="relative">
                      <Avatar name={u.name} src={u.avatar} size={44} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#008069] text-white flex items-center justify-center">
                        <X className="w-2.5 h-2.5" />
                      </span>
                    </div>
                    <span className="text-xs text-[#111b21] dark:text-[#e9edef] truncate w-full text-center">
                      {u.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto wa-scroll">
              {filtered.map((u) => {
                const checked = selected.has(u.id)
                return (
                  <button
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition text-left border-b border-[#f0f2f5] dark:border-[#1d282f]"
                  >
                    <Avatar name={u.name} src={u.avatar} size={44} online={u.presence === 'online'} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">{u.name}</div>
                      <div className="text-xs text-[#667781] dark:text-[#8696a0] truncate">{u.about}</div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        checked
                          ? 'bg-[#008069] border-[#008069]'
                          : 'border-[#cbd5d8] dark:border-[#3b4a54]'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="p-4 bg-white dark:bg-[#111b21] border-t border-[#e9edef] dark:border-[#222e35] shrink-0">
              <button
                disabled={selected.size < 1}
                onClick={() => setStep('name')}
                className="w-full py-3 rounded-full bg-[#008069] dark:bg-[#00a884] text-white font-medium disabled:opacity-40 hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" /> Next ({selected.size})
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#008069] dark:bg-[#005c4b] text-white px-4 py-4 shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('select')} className="hover:opacity-80">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-medium">New group</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto wa-scroll p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-[#008069] flex items-center justify-center">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group subject"
                  className="w-full text-center border-b-2 border-[#008069] bg-transparent py-2 text-lg text-[#111b21] dark:text-[#e9edef] outline-none"
                  autoFocus
                  maxLength={50}
                />
                <p className="text-sm text-[#667781] dark:text-[#8696a0]">
                  {selected.size + 1} participants (including you)
                </p>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-[#111b21] border-t border-[#e9edef] dark:border-[#222e35] shrink-0">
              <button
                disabled={!groupName.trim()}
                onClick={() => onCreate(groupName.trim(), Array.from(selected))}
                className="w-full py-3 rounded-full bg-[#008069] dark:bg-[#00a884] text-white font-medium disabled:opacity-40 hover:opacity-90 transition"
              >
                Create group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
