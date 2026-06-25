import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/chat/session'

// GET /api/conversations — list current user's conversations with last message + unread count
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const participations = await db.participant.findMany({
    where: { userId: me.id },
    include: {
      conversation: {
        include: {
          participants: { include: { user: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  })

  // If conversations have no messages, they still need ordering by updatedAt.
  // We'll bump conversation.updatedAt whenever a message is sent (handled in /api/messages).
  const conversations = participations
    .map((p) => {
      const conv = p.conversation
      const others = conv.participants.filter((pp) => pp.userId !== me.id).map((pp) => pp.user)
      const lastMessage = conv.messages[0] ?? null
      const unreadCount = lastMessage
        ? 0 // computed below via separate query for accuracy
        : 0
      return {
        id: conv.id,
        name: conv.name,
        avatar: conv.avatar,
        isGroup: conv.isGroup,
        about: conv.about,
        participants: conv.participants.map((pp) => ({
          userId: pp.userId,
          name: pp.user.name,
          phone: pp.user.phone,
          avatar: pp.user.avatar,
          about: pp.user.about,
          presence: pp.user.presence,
          lastSeen: pp.user.lastSeen,
        })),
        otherUser: conv.isGroup ? null : others[0] ?? null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              type: lastMessage.type,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              status: lastMessage.status,
            }
          : null,
        lastReadAt: p.lastReadAt,
      }
    })

  // Compute unread counts for each conversation
  const result = await Promise.all(
    conversations.map(async (c) => {
      const unread = await db.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: me.id },
          createdAt: { gt: c.lastReadAt ?? new Date(0) },
        },
      })
      return { ...c, unreadCount: unread }
    })
  )

  // Sort by last message time desc (fallback to updatedAt)
  result.sort((a, b) => {
    const aTime = a.lastMessage ? a.lastMessage.createdAt.getTime() : 0
    const bTime = b.lastMessage ? b.lastMessage.createdAt.getTime() : 0
    return bTime - aTime
  })

  return NextResponse.json({ conversations: result })
}

// POST /api/conversations — create a 1-on-1 or group conversation
// Body: { participantIds: string[], isGroup?: boolean, name?: string }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { participantIds, isGroup, name } = await req.json()
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return NextResponse.json({ error: 'participantIds required' }, { status: 400 })
  }

  const allIds = Array.from(new Set([me.id, ...participantIds]))

  // For 1-on-1, check if a conversation already exists between these two users
  if (!isGroup && allIds.length === 2) {
    const otherId = allIds.find((id) => id !== me.id)!
    const existing = await db.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [me.id, otherId] },
          },
        },
      },
      include: { participants: true },
    })
    // The above isn't perfectly precise (it could match a convo with exactly one of them).
    // Filter to ensure BOTH are present and no others.
    if (existing && existing.participants.length === 2) {
      const ids = existing.participants.map((p) => p.userId).sort()
      if (ids[0] === [me.id, otherId].sort()[0] && ids[1] === [me.id, otherId].sort()[1]) {
        return NextResponse.json({ conversation: { id: existing.id }, existed: true })
      }
    }
  }

  const conv = await db.conversation.create({
    data: {
      isGroup: !!isGroup,
      name: isGroup ? name ?? 'New Group' : null,
      createdBy: me.id,
      participants: {
        create: allIds.map((uid) => ({ userId: uid })),
      },
    },
  })

  return NextResponse.json({ conversation: { id: conv.id }, existed: false })
}
