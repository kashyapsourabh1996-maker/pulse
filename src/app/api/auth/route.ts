import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { onboardNewUser } from '@/lib/chat/onboarding'

// Simple cookie-based session: the current user id is stored in a cookie.
const SESSION_COOKIE = 'wa_user_id'

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json()

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    // Upsert user by phone — if exists, update name; else create.
    const user = await db.user.upsert({
      where: { phone: phone.trim() },
      update: { name: name.trim() },
      create: { phone: phone.trim(), name: name.trim() },
    })

    // If this is a brand-new user, create demo conversations so the chat list isn't empty.
    await onboardNewUser(user.id)

    const res = NextResponse.json({ user })
    res.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return res
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const store = await cookies()
    const userId = store.get(SESSION_COOKIE)?.value
    if (!userId) {
      return NextResponse.json({ user: null })
    }
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      const res = NextResponse.json({ user: null })
      res.cookies.delete(SESSION_COOKIE)
      return res
    }
    return NextResponse.json({ user })
  } catch (e) {
    console.error('Session check error:', e)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
