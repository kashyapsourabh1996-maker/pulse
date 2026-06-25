import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

/**
 * Chat Socket Service — thin real-time relay for the Pulse chat app.
 *
 * Responsibilities:
 *  - Track online presence (in-memory only; DB persistence handled by Next.js API).
 *  - Relay chat events between connected clients:
 *      send-message, typing, stop-typing, read-messages, message-status
 *  - Broadcast presence updates (online/offline) to all clients.
 *
 * Port selection (in priority order):
 *   1. SOCKET_PORT env var  (explicit override)
 *   2. PORT env var         (set by Railway/Render/Heroku)
 *   3. 3003                 (default — used in the sandbox)
 *
 * In the sandbox, the Caddy gateway forwards "/" with ?XTransformPort=3003.
 * In production behind nginx, route /socket.io/ to this service's port.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnlineUser {
  userId: string
  name: string
  socketId: string
}

interface ChatMessage {
  id: string
  senderId: string
  content: string
  type: string
  createdAt: string
  status: string
  [key: string]: unknown
}

interface UserOnlinePayload {
  userId: string
  name: string
}

interface SendMessagePayload {
  conversationId: string
  message: ChatMessage
  recipientIds: string[]
}

interface TypingPayload {
  conversationId: string
  userId: string
  name: string
  isGroup: boolean
  recipientIds?: string[]
}

interface StopTypingPayload {
  conversationId: string
  userId: string
  recipientIds?: string[]
}

interface ReadMessagesPayload {
  conversationId: string
  userId: string
  recipientIds: string[]
}

interface MessageStatusPayload {
  conversationId: string
  messageId: string
  status: 'delivered' | 'read'
  recipientIds: string[]
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

const onlineUsers = new Map<string, OnlineUser>() // userId -> info
const socketToUser = new Map<string, string>() // socketId -> userId

// ---------------------------------------------------------------------------
// HTTP + Socket.io server
// ---------------------------------------------------------------------------

const httpServer = createServer()

// Path: '/' for the sandbox Caddy gateway, '/socket.io' (default) for production nginx.
// Set SOCKET_PATH to override if needed.
const SOCKET_PATH = process.env.SOCKET_PATH ?? '/'

// Allowed origins for CORS. Set SOCKET_CORS_ORIGIN to your frontend URL in production
// (e.g. "https://pulse.yourdomain.com"). Defaults to "*" for development.
const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN ?? '*'

const io = new Server(httpServer, {
  path: SOCKET_PATH,
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Port: SOCKET_PORT > PORT (auto-set by PaaS) > 3003 default
const PORT = Number(process.env.SOCKET_PORT ?? process.env.PORT ?? 3003)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Emit an event to a specific user (by userId) if they are currently online.
 */
function emitToUser(userId: string, event: string, data: unknown): boolean {
  const user = onlineUsers.get(userId)
  if (!user) return false
  try {
    io.to(user.socketId).emit(event, data)
    return true
  } catch (err) {
    console.error(`[emitToUser] Failed to emit "${event}" to user ${userId}:`, err)
    return false
  }
}

/**
 * Get the list of currently-online user ids.
 */
function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys())
}

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

io.on('connection', (socket: Socket) => {
  console.log(`[socket] connected: ${socket.id}`)

  // --- user-online --------------------------------------------------------
  socket.on('user-online', (payload: UserOnlinePayload) => {
    try {
      if (!payload || !payload.userId) {
        console.warn('[user-online] invalid payload, ignoring')
        return
      }
      const { userId, name } = payload

      // Clean up any prior socket mapping for this user (e.g. reconnect).
      const existing = onlineUsers.get(userId)
      if (existing && existing.socketId !== socket.id) {
        socketToUser.delete(existing.socketId)
      }

      onlineUsers.set(userId, { userId, name: name ?? userId, socketId: socket.id })
      socketToUser.set(socket.id, userId)

      console.log(`[user-online] ${name} (${userId}) on socket ${socket.id} | online=${onlineUsers.size}`)

      // Broadcast presence change to ALL clients.
      io.emit('presence-update', { userId, presence: 'online' })

      // Tell the joining socket who's online right now.
      socket.emit('online-users', { users: getOnlineUserIds() })
    } catch (err) {
      console.error('[user-online] error:', err)
    }
  })

  // --- send-message -------------------------------------------------------
  socket.on('send-message', (payload: SendMessagePayload) => {
    try {
      if (!payload || !payload.conversationId || !payload.message) {
        console.warn('[send-message] invalid payload, ignoring')
        return
      }
      const { conversationId, message, recipientIds = [] } = payload

      let deliveredCount = 0
      for (const recipientId of recipientIds) {
        if (emitToUser(recipientId, 'receive-message', message)) {
          deliveredCount++
        }
      }

      // Acknowledge back to the sender socket.
      socket.emit('message-delivered', {
        messageId: message.id,
        conversationId,
        deliveredCount,
      })
    } catch (err) {
      console.error('[send-message] error:', err)
    }
  })

  // --- typing -------------------------------------------------------------
  socket.on('typing', (payload: TypingPayload) => {
    try {
      if (!payload || !payload.conversationId || !payload.userId) return
      const { conversationId, userId, name, isGroup, recipientIds = [] } = payload
      const data = { conversationId, userId, name, isGroup }
      for (const recipientId of recipientIds) {
        emitToUser(recipientId, 'typing', data)
      }
    } catch (err) {
      console.error('[typing] error:', err)
    }
  })

  // --- stop-typing --------------------------------------------------------
  socket.on('stop-typing', (payload: StopTypingPayload) => {
    try {
      if (!payload || !payload.conversationId || !payload.userId) return
      const { conversationId, userId, recipientIds = [] } = payload
      const data = { conversationId, userId }
      for (const recipientId of recipientIds) {
        emitToUser(recipientId, 'stop-typing', data)
      }
    } catch (err) {
      console.error('[stop-typing] error:', err)
    }
  })

  // --- read-messages ------------------------------------------------------
  socket.on('read-messages', (payload: ReadMessagesPayload) => {
    try {
      if (!payload || !payload.conversationId || !payload.userId) return
      const { conversationId, userId, recipientIds = [] } = payload
      const data = { conversationId, userId }
      for (const recipientId of recipientIds) {
        emitToUser(recipientId, 'messages-read', data)
      }
    } catch (err) {
      console.error('[read-messages] error:', err)
    }
  })

  // --- message-status -----------------------------------------------------
  socket.on('message-status', (payload: MessageStatusPayload) => {
    try {
      if (!payload || !payload.conversationId || !payload.messageId || !payload.status) return
      const { conversationId, messageId, status, recipientIds = [] } = payload
      const data = { conversationId, messageId, status }
      for (const recipientId of recipientIds) {
        emitToUser(recipientId, 'message-status-update', data)
      }
    } catch (err) {
      console.error('[message-status] error:', err)
    }
  })

  // --- generic error ------------------------------------------------------
  socket.on('error', (error: unknown) => {
    console.error(`[socket] error on ${socket.id}:`, error)
  })

  // --- disconnect ---------------------------------------------------------
  socket.on('disconnect', (reason: string) => {
    try {
      const userId = socketToUser.get(socket.id)
      socketToUser.delete(socket.id)

      if (userId) {
        const removed = onlineUsers.get(userId)
        // Only delete if the stored socketId still matches this one
        // (the user may have reconnected on a new socket already).
        if (removed && removed.socketId === socket.id) {
          onlineUsers.delete(userId)
          io.emit('presence-update', { userId, presence: 'offline' })
          console.log(
            `[disconnect] ${removed.name} (${userId}) | reason=${reason} | online=${onlineUsers.size}`,
          )
        } else {
          console.log(`[disconnect] ${socket.id} (stale) | reason=${reason} | online=${onlineUsers.size}`)
        }
      } else {
        console.log(`[disconnect] ${socket.id} (anonymous) | reason=${reason}`)
      }
    } catch (err) {
      console.error('[disconnect] error:', err)
    }
  })
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`Chat socket service running on port ${PORT}`)
})

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string) {
  console.log(`Received ${signal} signal, shutting down chat service...`)
  io.close(() => {
    httpServer.close(() => {
      console.log('Chat socket service closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
