# 💬 Pulse

A real-time messaging app built with Next.js 16, Prisma, and Socket.io — WhatsApp-style chat with groups, status updates, typing indicators, read receipts, and presence.

![Pulse](public/pulse-logo.jpg)

## ✨ Features

- **Real-time messaging** — instant delivery via Socket.io
- **One-on-one & group chats** — create groups with multiple participants
- **Status updates** — share text stories with colored backgrounds (24h expiry)
- **Presence** — see who's online + last seen timestamps
- **Typing indicators** — see when others are typing
- **Read receipts** — blue ticks when your message is read
- **Emoji picker** — 8 categories, 300+ emojis
- **Dark mode** — full light/dark theme support
- **Responsive** — works on mobile and desktop

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API Routes (REST) |
| Real-time | Socket.io (separate mini-service) |
| Database | Prisma ORM + SQLite (default) / PostgreSQL (production) |
| Auth | Cookie-based session |

## 🚀 Quick Start (local development)

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Bun](https://bun.sh/) — `curl -fsSL https://bun.sh/install | bash`

### Setup

```bash
# 1. Install dependencies
bun install
cd mini-services/chat-service && bun install && cd ../..

# 2. Set up environment variables
cp .env.example .env
# (defaults work for local dev — SQLite + sandbox socket)

# 3. Set up the database
bun run db:push        # create tables
bun run prisma/seed.ts # load demo data (8 users, 8 chats, 4 stories)

# 4. Start the socket service (in a separate terminal)
cd mini-services/chat-service
bun run dev
# → "Chat socket service running on port 3003"

# 5. Start the Next.js app (in another terminal)
bun run dev
# → http://localhost:3000
```

Open **http://localhost:3000**, enter any name + 10-digit phone number, and you're in.

## 📜 Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start Next.js dev server (port 3000) |
| `bun run build` | Production build |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run prisma/seed.ts` | Load demo data |

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema (6 models)
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, messages, conversations, ...)
│   │   ├── page.tsx         # Entry: login or chat
│   │   └── layout.tsx       # Root layout + theme
│   ├── components/chat/     # All UI components
│   └── lib/chat/            # Session, types, socket client, helpers
├── mini-services/
│   └── chat-service/        # Socket.io real-time relay (port 3003)
├── public/                  # Logo + static assets
├── .env.example             # Environment variable template
├── DEPLOYMENT.md            # Full deployment guide
└── ecosystem.config.cjs     # PM2 config (VPS deployment)
```

## 🌐 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete guides:

- **Option A**: Vercel + Railway + Neon (easiest, free tiers)
- **Option B**: Single VPS with PM2 + nginx (full control)

Quick health check after deploy: `GET /api/health`

## 🔒 Security Notes

This is a **demo app**. Before launching to real users:

- [ ] Add OTP/SMS phone verification
- [ ] Implement proper auth (JWT + refresh tokens)
- [ ] Encrypt stored messages (the "🔒 encrypted" banner is cosmetic)
- [ ] Add rate limiting to API routes
- [ ] Add a privacy policy + consent screen (DPDP Act 2023 compliance)
- [ ] Add account deletion (right to erasure)
- [ ] Appoint a grievance officer (IT Rules 2021)

See the in-app security discussion for details.

## 📄 License

MIT — free to use, modify, and deploy.
