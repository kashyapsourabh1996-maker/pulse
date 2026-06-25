'use client'

import * as React from 'react'
import { Plus, X, Camera, PenLine, Eye } from 'lucide-react'
import { Avatar } from './avatar'
import { formatChatListTime } from '@/lib/chat/format'
import type { StoryGroup } from '@/lib/chat/types'

const STORY_COLORS = ['#25D366', '#075E54', '#128C7E', '#34B7F1', '#5B5EA6', '#E94B3C']

interface StoriesPanelProps {
  groups: StoryGroup[]
  meName: string
  meAvatar: string | null
  hasMyStory: boolean
  onOpenViewer: (groupIndex: number, storyIndex?: number) => void
  onCreateStory: (content: string, bgColor: string) => void
}

export function StoriesPanel({
  groups,
  meName,
  meAvatar,
  hasMyStory,
  onOpenViewer,
  onCreateStory,
}: StoriesPanelProps) {
  const [composing, setComposing] = React.useState(false)
  const [text, setText] = React.useState('')
  const [colorIdx, setColorIdx] = React.useState(0)

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
        <h1 className="text-lg font-semibold text-[#111b21] dark:text-[#e9edef]">Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto wa-scroll">
        {/* My status */}
        <button
          onClick={() => (hasMyStory ? onOpenViewer(-1) : setComposing(true))}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition border-b border-[#f0f2f5] dark:border-[#1d282f] text-left"
        >
          <div className="relative">
            <Avatar name={meName} src={meAvatar} size={48} />
            {!hasMyStory && (
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#B91C1C] border-2 border-white dark:border-[#111b21] flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[#111b21] dark:text-[#e9edef]">My status</div>
            <div className="text-xs text-[#667781] dark:text-[#8696a0]">
              {hasMyStory ? 'Tap to view' : 'Tap to add status update'}
            </div>
          </div>
        </button>

        {/* Recent updates */}
        {groups.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs font-medium text-[#667781] dark:text-[#8696a0] uppercase tracking-wide bg-[#f0f2f5] dark:bg-[#0b141a]">
              Recent updates
            </div>
            {groups.map((g, idx) => {
              const allViewed = g.stories.every((s) => s.viewedByMe)
              return (
                <button
                  key={g.user.id}
                  onClick={() => onOpenViewer(idx)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition border-b border-[#f0f2f5] dark:border-[#1d282f] text-left"
                >
                  <div
                    className={`p-0.5 rounded-full ${allViewed ? 'story-ring-viewed' : 'story-ring'}`}
                  >
                    <div className="p-0.5 rounded-full bg-white dark:bg-[#111b21]">
                      <Avatar name={g.user.name} src={g.user.avatar} size={44} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#111b21] dark:text-[#e9edef] truncate">{g.user.name}</div>
                    <div className="text-xs text-[#667781] dark:text-[#8696a0]">
                      {formatChatListTime(g.stories[0].createdAt)}
                    </div>
                  </div>
                </button>
              )
            })}
          </>
        )}

        {/* Compose new status button */}
        <div className="p-4">
          <button
            onClick={() => setComposing(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#B91C1C]/10 hover:bg-[#B91C1C]/20 transition text-left"
          >
            <div className="w-12 h-12 rounded-full bg-[#B91C1C] flex items-center justify-center shrink-0">
              <PenLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-[#111b21] dark:text-[#e9edef]">Add text status</div>
              <div className="text-xs text-[#667781] dark:text-[#8696a0]">Share what you're up to</div>
            </div>
          </button>
        </div>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 wa-fade-in" onClick={() => setComposing(false)}>
          <div
            className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden flex flex-col"
            style={{ backgroundColor: STORY_COLORS[colorIdx] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setComposing(false)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50">
              <X className="w-5 h-5" />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a status..."
              autoFocus
              className="flex-1 w-full bg-transparent text-white text-2xl font-medium text-center p-8 outline-none resize-none placeholder:text-white/60 flex items-center justify-center"
              style={{ display: 'flex' }}
            />
            <div className="p-4 flex items-center justify-between">
              <div className="flex gap-2">
                {STORY_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setColorIdx(i)}
                    className={`w-7 h-7 rounded-full transition ${colorIdx === i ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  if (text.trim()) {
                    onCreateStory(text.trim(), STORY_COLORS[colorIdx])
                    setText('')
                    setComposing(false)
                  }
                }}
                disabled={!text.trim()}
                className="w-12 h-12 rounded-full bg-white text-[#075E54] flex items-center justify-center disabled:opacity-50 hover:scale-105 transition shadow-lg"
              >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StoryViewerProps {
  groups: StoryGroup[]
  startGroup: number
  onClose: () => void
  onView: (storyId: string) => void
}

export function StoryViewer({ groups, startGroup, onClose, onView }: StoryViewerProps) {
  const [gIdx, setGIdx] = React.useState(startGroup)
  const [sIdx, setSIdx] = React.useState(0)
  const [progress, setProgress] = React.useState(0)

  const group = groups[gIdx]
  const story = group?.stories[sIdx]

  React.useEffect(() => {
    if (!story) return
    onView(story.id)
    setProgress(0)
    const start = Date.now()
    const duration = 5000
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(100, (elapsed / duration) * 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        if (sIdx < group.stories.length - 1) {
          setSIdx((i) => i + 1)
        } else if (gIdx < groups.length - 1) {
          setGIdx((i) => i + 1)
          setSIdx(0)
        } else {
          onClose()
        }
      }
    }, 50)
    return () => clearInterval(interval)
  }, [gIdx, sIdx])

  if (!group || !story) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center wa-fade-in">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75"
              style={{ width: i < sIdx ? '100%' : i === sIdx ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center gap-3 z-20">
        <Avatar name={group.user.name} src={group.user.avatar} size={36} />
        <div className="flex-1">
          <div className="text-white font-medium text-sm">{group.user.name}</div>
          <div className="text-white/70 text-xs">{formatChatListTime(story.createdAt)}</div>
        </div>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Story content */}
      <div
        className="relative w-full h-full max-w-md flex items-center justify-center"
        style={{ backgroundColor: story.bgColor ?? '#25D366' }}
      >
        <p className="text-white text-3xl font-semibold text-center px-8 whitespace-pre-wrap">{story.content}</p>
      </div>

      {/* Tap zones */}
      <button
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        onClick={() => {
          if (sIdx > 0) setSIdx((i) => i - 1)
          else if (gIdx > 0) {
            setGIdx((i) => i - 1)
            setSIdx(groups[gIdx - 1].stories.length - 1)
          }
        }}
      />
      <button
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        onClick={() => {
          if (sIdx < group.stories.length - 1) setSIdx((i) => i + 1)
          else if (gIdx < groups.length - 1) {
            setGIdx((i) => i + 1)
            setSIdx(0)
          } else onClose()
        }}
      />

      {/* View count */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/80 text-sm z-20">
        <Eye className="w-4 h-4" />
        <span>Story disappears in 24h</span>
      </div>
    </div>
  )
}
