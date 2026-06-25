import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/chat/session'

// GET /api/messages?conversationId=...&cursor=...&take=...
// Returns messages for a conversation (paginated, oldest-first for display after reversal)
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

  // Ensure the user is a participant
  const p = await db.participant.findUnique({
    where: { userId_conversationId: { userId: me.id, conversationId } },
  })
  if (!p) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  const take = Math.min(Number(searchParams.get('take') ?? 50), 100)
  const cursor = searchParams.get('cursor') // message id

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  })

  const hasMore = messages.length > take
  const items = messages.slice(0, take)
  // Reverse so oldest is first (for chat display)
  items.reverse()

  return NextResponse.json({
    messages: items.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      sender: m.sender,
      content: m.content,
      type: m.type,
      mediaUrl: m.mediaUrl,
      status: m.status,
      createdAt: m.createdAt,
    })),
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  })
}

// POST /api/messages — send a message
// Body: { conversationId: string; content: string; type?: string; mediaUrl?: string }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, content, type = 'text', mediaUrl } = await req.json()
  if (!conversationId || !content) {
    return NextResponse.json({ error: 'conversationId and content required' }, { status: 400 })
  }

  // Ensure participant
  const p = await db.participant.findUnique({
    where: { userId_conversationId: { userId: me.id, conversationId } },
  })
  if (!p) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  const message = await db.message.create({
    data: {
      conversationId,
      senderId: me.id,
      content,
      type,
      mediaUrl: mediaUrl ?? null,
      status: 'sent',
    },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  })

  // Bump conversation updatedAt so it sorts to the top
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  // Gather recipient ids (everyone except sender) for the socket relay
  const participants = await db.participant.findMany({
    where: { conversationId, userId: { not: me.id } },
    select: { userId: true },
  })

  return NextResponse.json({
    message: {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: message.sender,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      status: message.status,
      createdAt: message.createdAt,
    },
    recipientIds: participants.map((pp) => pp.userId),
  })
}

// PATCH /api/messages — mark messages in a conversation as read by current user
// Body: { conversationId: string }
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await req.json()
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

  // Update participant's lastReadAt
  await db.participant.update({
    where: { userId_conversationId: { userId: me.id, conversationId } },
    data: { lastReadAt: new Date() },
  })

  // Mark messages FROM OTHERS as read
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: me.id },
      status: { not: 'read' },
    },
    data: { status: 'read' },
  })

  // Gather recipient ids (everyone except current user) so frontend can relay via socket
  const participants = await db.participant.findMany({
    where: { conversationId, userId: { not: me.id } },
    select: { userId: true },
  })

  return NextResponse.json({ ok: true, recipientIds: participants.map((pp) => pp.userId) })
}
