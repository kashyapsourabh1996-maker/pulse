# 🚀 Pulse — Deployment Guide

This guide covers two ways to deploy Pulse to your own domain. Pick the one that fits you.

| | Option A: Vercel + Railway | Option B: Single VPS |
|---|---|---|
| **Difficulty** | 🟢 Easiest | 🟡 Medium |
| **Cost** | Free tiers (small scale) | ~₹400–800/month |
| **Best for** | Quick launch, testing | Full control, scaling |
| **Database** | Hosted Postgres (Neon/Supabase) | SQLite file or local Postgres |
| **Real-time** | Railway (separate URL) | Same server, nginx proxy |

---

## 📋 Prerequisites (both options)

- A **domain name** (buy from GoDaddy / Namecheap / Hostinger — ~₹500–1000/year)
- The **Pulse codebase** pushed to a **GitHub repository**
- **Node.js 18+** and **Bun** installed (for local dev)

### Push to GitHub
```bash
cd my-project
git init
git add .
git commit -m "Pulse — initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pulse.git
git push -u origin main
```

---

## 🅰️ Option A: Vercel (frontend) + Railway (socket service) + Neon (database)

This is the **easiest** path. Three free-tier services, no server management.

### Step 1: Create a PostgreSQL database (Neon)

1. Go to **https://neon.tech** → sign up (free, GitHub login)
2. Create a new project → copy the **connection string**
   (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/pulse?sslmode=require`)
3. Save it — you'll need it in Steps 2 & 3.

### Step 2: Deploy the socket service to Railway

1. Go to **https://railway.app** → sign up (GitHub login)
2. **New Project** → **Deploy from GitHub repo** → select your Pulse repo
3. Set the **Root Directory** to `mini-services/chat-service`
4. Go to **Settings → Build**:
   - Build command: `bun install`
   - Start command: `bun run start`
5. Go to **Variables** and add:
   ```
   SOCKET_PATH=/socket.io
   SOCKET_CORS_ORIGIN=https://YOUR-VERCEL-DOMAIN.vercel.app
   ```
   (you'll update the CORS origin after Step 3)
6. Go to **Settings → Networking** → **Generate Domain**
   → you get a URL like `pulse-chat-production.up.railway.app`
7. Save that Railway URL — you'll need it next.

### Step 3: Deploy the frontend to Vercel

1. Go to **https://vercel.com** → sign up (GitHub login)
2. **Add New Project** → import your Pulse GitHub repo
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: leave as `/` (project root)
5. **Environment Variables** — add these:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/pulse?sslmode=require
   NEXT_PUBLIC_SOCKET_URL=https://pulse-chat-production.up.railway.app
   ```
6. **Deploy** → wait ~2 minutes → you get `https://pulse-xxx.vercel.app`

### Step 4: Update CORS on Railway

Go back to Railway → Variables → update:
```
SOCKET_CORS_ORIGIN=https://pulse-xxx.vercel.app
```
(Railway auto-redeploys when you save.)

### Step 5: Set up the database schema

After the first Vercel deploy, run the Prisma migration. Easiest way — from your local machine:

```bash
# In your project root, create a temporary .env with the Neon DATABASE_URL
echo 'DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/pulse?sslmode=require' > .env

# Switch Prisma to PostgreSQL
# Edit prisma/schema.prisma → change `provider = "sqlite"` to `provider = "postgresql"`

# Push the schema
bun run db:push

# Seed demo data (optional)
bun run prisma/seed.ts
```

### Step 6: Add your custom domain

1. In **Vercel** → your project → **Settings → Domains**
2. Add `pulse.yourdomain.com` (or `chat.yourdomain.com`)
3. Vercel shows you a **CNAME record** to add:
   - Go to your **domain registrar** (GoDaddy/Namecheap) → DNS settings
   - Add a CNAME record: `pulse` → `cname.vercel-dns.com`
4. Wait 5–30 min for DNS to propagate → Vercel auto-provisions SSL (HTTPS) ✅

### Step 7: Final env update

Back in Vercel, update the socket URL if you want to use your domain for the socket too:
```
NEXT_PUBLIC_SOCKET_URL=https://socket.yourdomain.com
```
(or just keep using the Railway URL — it works fine)

🎉 **Done!** Pulse is live at `https://pulse.yourdomain.com`

---

## 🅱️ Option B: Single VPS (DigitalOcean / Hetzner / AWS Lightsail)

Best for cost control and full ownership. One server runs everything.

### Step 1: Provision a server

1. Create a VPS (DigitalOcean droplet / Hetzner CX22 / AWS Lightsail)
   - **OS**: Ubuntu 22.04 LTS
   - **Size**: 1 vCPU / 1GB RAM minimum (₹400–800/month)
2. SSH into the server:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

### Step 2: Install dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PM2 (process manager)
npm install -g pm2

# Install nginx
apt install -y nginx

# Install certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### Step 3: Clone & build Pulse

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/pulse.git
cd pulse

# Install dependencies
bun install
cd mini-services/chat-service && bun install && cd ../..

# Create .env
cp .env.example .env
nano .env
# Set:
#   DATABASE_URL="file:./db/pulse.db"   (SQLite — simplest for VPS)
#   NEXT_PUBLIC_SOCKET_URL=""            (same-origin, nginx will proxy)

# Build the Next.js app
bun run build

# Set up the database
bun run db:push
bun run prisma/seed.ts   # optional: load demo data
```

### Step 4: Configure PM2 (keep it running forever)

Create `ecosystem.config.cjs` (already included in the repo):
```js
module.exports = {
  apps: [
    {
      name: 'pulse-web',
      cwd: '/var/www/pulse',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'pulse-socket',
      cwd: '/var/www/pulse/mini-services/chat-service',
      script: 'index.ts',
      env: { SOCKET_PORT: '3003', SOCKET_PATH: '/socket.io' },
    },
  ],
}
```

Start everything:
```bash
cd /var/www/pulse
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # auto-start on server reboot (follow the instructions it prints)
```

### Step 5: Configure nginx (reverse proxy + SSL)

Create `/etc/nginx/sites-available/pulse`:
```nginx
server {
    listen 80;
    server_name pulse.yourdomain.com;

    # Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io service
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable & restart:
```bash
ln -s /etc/nginx/sites-available/pulse /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t          # test config
systemctl restart nginx
```

### Step 6: Add your domain + SSL

1. At your **domain registrar** → DNS settings:
   - Add an **A record**: `pulse` → `YOUR_SERVER_IP`
2. On the server, get free SSL:
   ```bash
   certbot --nginx -d pulse.yourdomain.com
   ```
   (certbot auto-renews every 90 days)

🎉 **Done!** Pulse is live at `https://pulse.yourdomain.com`

### Useful PM2 commands
```bash
pm2 status              # see running processes
pm2 logs pulse-web      # view Next.js logs
pm2 logs pulse-socket   # view socket logs
pm2 restart all         # restart after code updates
pm2 stop all            # stop everything
```

### Updating Pulse after code changes
```bash
cd /var/www/pulse
git pull origin main
bun install
bun run build
cd mini-services/chat-service && bun install && cd ../..
pm2 restart all
```

---

## 🔍 Post-deploy verification

After deploying, check that everything works:

1. **Health check**: visit `https://pulse.yourdomain.com/api/health`
   → should return `{"status":"ok","db":"ok","app":"pulse",...}`
2. **Login**: enter a name + phone → should land in the chat app
3. **Real-time**: open the site in **two browser tabs** (different names) →
   send a message from one → it should appear instantly in the other
4. **Socket connection**: open browser DevTools → Console →
   if no connection errors, the socket is working

---

## 🔧 Environment variables reference

### Next.js app (`.env` in project root)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite path or PostgreSQL connection string |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | See [socket modes](#frontend-nextjs-public-env-vars--exposed-to-the-browser) in `.env.example` |

### Socket service (`mini-services/chat-service/.env`)

| Variable | Default | Description |
|---|---|---|
| `SOCKET_PORT` | `3003` | Port to listen on |
| `SOCKET_PATH` | `/` | `/` for sandbox, `/socket.io` for production |
| `SOCKET_CORS_ORIGIN` | `*` | Your frontend URL in production |

---

## 🗄️ Database: SQLite vs PostgreSQL

| | SQLite | PostgreSQL |
|---|---|---|
| **Setup** | Zero config (just a file) | Needs a server/service |
| **Scale** | ~1,000 concurrent users | 100,000+ users |
| **Concurrent writes** | Limited (1 writer) | Excellent |
| **Best for** | VPS small deployment, testing | Production, Vercel, scaling |
| **Backups** | Copy the `.db` file | `pg_dump` |

### Switching to PostgreSQL
1. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres connection string
3. Run `bun run db:push` to create the tables

### Backing up SQLite (VPS)
```bash
# Stop the app first to avoid writes during backup
pm2 stop pulse-web
cp /var/www/pulse/db/pulse.db /backups/pulse-$(date +%Y%m%d).db
pm2 start pulse-web
```
Add this to a cron job for daily backups.

---

## 🆘 Troubleshooting

**Socket not connecting?**
- Check `NEXT_PUBLIC_SOCKET_URL` is correct
- Check `SOCKET_CORS_ORIGIN` on the socket service matches your frontend URL
- Check browser console for CORS errors
- Verify the socket service health: `curl https://your-socket-url/socket.io/?EIO=4&transport=polling`

**Messages not saving?**
- Check `DATABASE_URL` is correct
- Verify DB health: `GET /api/health` → `db: "ok"`
- Check server logs: `pm2 logs pulse-web` (VPS) or Vercel dashboard

**Real-time works locally but not in production?**
- You probably forgot to set `NEXT_PUBLIC_SOCKET_URL` in production env
- Remember: `NEXT_PUBLIC_*` vars are baked in at **build time** — after changing them, **redeploy**

**"Cannot find module" errors after switching to Postgres?**
- Run `bun run db:generate` to regenerate the Prisma client for Postgres

---

Need help? Check the [README.md](./README.md) for local development, or review the [codebase architecture](#) explained in the app.
