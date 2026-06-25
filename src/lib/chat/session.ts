import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SESSION_COOKIE = 'wa_user_id'

/** Returns the current user record or null. */
export async function getCurrentUser() {
  try {
    const store = await cookies()
    const userId = store.get(SESSION_COOKIE)?.value
    if (!userId) return null
    const user = await db.user.findUnique({ where: { id: userId } })
    return user ?? null
  } catch {
    return null
  }
}

export { SESSION_COOKIE }
