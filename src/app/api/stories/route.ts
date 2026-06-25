import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/chat/session'

// GET /api/stories — active stories from all users (not expired)
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const stories = await db.story.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      viewers: { select: { userId: true } },
    },
  })

  // Group by user
  const byUser = new Map<string, { user: any; stories: any[] }>()
  for (const s of stories) {
    const entry = byUser.get(s.userId) ?? { user: s.user, stories: [] }
    entry.stories.push({
      id: s.id,
      content: s.content,
      type: s.type,
      bgColor: s.bgColor,
      mediaUrl: s.mediaUrl,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      viewedByMe: s.viewers.some((v) => v.userId === me.id),
    })
    byUser.set(s.userId, entry)
  }

  return NextResponse.json({ groups: Array.from(byUser.values()) })
}

// POST /api/stories — create a story (text or image)
// Body: { content: string; type?: "text"|"image"; bgColor?: string; mediaUrl?: string }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, type = 'text', bgColor, mediaUrl } = await req.json()
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const story = await db.story.create({
    data: {
      userId: me.id,
      content,
      type,
      bgColor: bgColor ?? '#25D366',
      mediaUrl: mediaUrl ?? null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
  return NextResponse.json({ story })
}

// PATCH /api/stories — mark a story as viewed by current user
// Body: { storyId: string }
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storyId } = await req.json()
  if (!storyId) return NextResponse.json({ error: 'storyId required' }, { status: 400 })

  await db.storyView.upsert({
    where: { storyId_userId: { storyId, userId: me.id } },
    update: {},
    create: { storyId, userId: me.id },
  })
  return NextResponse.json({ ok: true })
}
