import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/chat/session'

// GET /api/users?q=...  — search users by name/phone (excluding self) for "new chat"
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()

  const users = await db.user.findMany({
    where: {
      id: { not: me.id },
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    take: 50,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      phone: true,
      avatar: true,
      about: true,
      presence: true,
      lastSeen: true,
    },
  })

  return NextResponse.json({ users })
}

// PATCH /api/users — update own profile (name, about, avatar)
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, about, avatar } = await req.json()
  const data: Record<string, string | null> = {}
  if (typeof name === 'string' && name.trim()) data.name = name.trim()
  if (typeof about === 'string') data.about = about.trim().slice(0, 139)
  if (typeof avatar === 'string') data.avatar = avatar

  const user = await db.user.update({ where: { id: me.id }, data })
  return NextResponse.json({ user })
}
