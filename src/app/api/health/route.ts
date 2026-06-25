import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple health-check endpoint for deployment platforms (Vercel, Railway, uptime monitors).
// GET /api/health → { status: "ok", time, db: "ok" | "error" }
export async function GET() {
  let dbStatus: string = 'ok'
  try {
    // Lightweight query to confirm the DB is reachable
    await db.user.count()
  } catch {
    dbStatus = 'error'
  }
  return NextResponse.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    time: new Date().toISOString(),
    db: dbStatus,
    app: 'pulse',
  })
}
