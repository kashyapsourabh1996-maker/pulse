'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Returns the singleton socket.io client.
 *
 * Three connection modes (controlled by NEXT_PUBLIC_SOCKET_URL):
 *
 *  1. UNSET (undefined) — Sandbox mode.
 *     Uses the Caddy gateway pattern: `/?XTransformPort=<port>` with path `/`.
 *
 *  2. EMPTY STRING ("") — Same-origin production (nginx reverse proxy).
 *     Connects to the same origin with the standard path `/socket.io`.
 *     Requires nginx to proxy `/socket.io/` → the socket service port.
 *
 *  3. FULL URL ("https://socket.yourdomain.com") — Separate domain (Vercel + Railway).
 *     Connects directly to the socket service with path `/socket.io`.
 */
export function getSocket(): Socket {
  if (socket) return socket

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL

  let url: string
  let path: string

  if (socketUrl === undefined) {
    // Mode 1: Sandbox — Caddy gateway
    url = `/?XTransformPort=${process.env.NEXT_PUBLIC_SOCKET_PORT ?? 3003}`
    path = '/'
  } else if (socketUrl === '') {
    // Mode 2: Same-origin production (nginx proxy)
    url = '/'
    path = '/socket.io'
  } else {
    // Mode 3: Separate domain
    url = socketUrl
    path = '/socket.io'
  }

  socket = io(url, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    path,
  })
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
