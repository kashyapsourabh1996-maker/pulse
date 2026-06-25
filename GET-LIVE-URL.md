# 🌐 Get a Live URL for Pulse — Fast Guide

This guide gets Pulse live on the internet at a **clean URL** (no AI mentions) in about **30 minutes**, for **free**.

## ⏱️ Time / cost

| | |
|---|---|
| **Time** | ~30 minutes |
| **Cost** | ₹0 (all free tiers) |
| **Result** | `https://pulse-web.onrender.com` (clean URL, no AI) |

Later you can add your own domain like `pulse.yourdomain.com` for ~₹500/year.

---

## 📋 What you'll set up (3 free services on ONE platform)

```
┌─────────────────────────────────────────┐
│  Render.com  (one account, one dashboard) │
│                                           │
│  1. pulse-db    → PostgreSQL database    │
│  2. pulse-web   → Next.js app  → public URL  │
│  3. pulse-socket → Socket.io service → public URL  │
└─────────────────────────────────────────┘
```

We use **Render** because it hosts all 3 services in one place — simplest possible setup. The `render.yaml` file in your repo tells Render exactly what to create.

---

## 🚀 Step-by-step

### Step 1: Push Pulse to GitHub (5 min)

If you don't have a GitHub account, create one free at **github.com**.

```bash
cd my-project

# Initialize git
git init
git add .
git commit -m "Pulse — real-time chat app"

# Create a repo on GitHub (web UI), then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pulse.git
git push -u origin main
```

> **Tip:** Name the repo `pulse` (clean name). Make it public or private — both work.

---

### Step 2: Switch to PostgreSQL (1 min)

Cloud hosts don't support SQLite files. Run this one command:

```bash
bash scripts/switch-to-postgres.sh
git add -A
git commit -m "Switch to PostgreSQL for cloud deployment"
git push
```

This edits `prisma/schema.prisma` to use Postgres instead of SQLite.

---

### Step 3: Create a Render account (2 min)

1. Go to **https://render.com** → click **"Get Started"**
2. Sign up with **GitHub** (one click)
3. You're in the dashboard

---

### Step 4: Deploy everything with the Blueprint (10 min)

This is where the magic happens — Render reads your `render.yaml` and creates all 3 services automatically.

1. In Render dashboard → **New +** → **Blueprint**
2. Select your `pulse` GitHub repo
3. Render detects `render.yaml` → shows you 3 services it will create:
   - `pulse-db` (PostgreSQL)
   - `pulse-web` (Next.js)
   - `pulse-socket` (Socket.io)
4. Click **Apply**

Render now:
- Creates the Postgres database
- Builds & deploys the web app
- Builds & deploys the socket service
- Gives each a public URL

⏳ **Wait ~5–10 minutes** for the first build to finish.

---

### Step 5: Set up the database tables (2 min)

After the first deploy, you need to create the database tables. Two options:

**Option A — From Render dashboard (easiest):**
1. Click your `pulse-web` service → **Shell** tab
2. Run: `bun run db:push`
3. Run: `bun run prisma/seed.ts` (loads demo data — 8 Indian users, sample chats)

**Option B — From your local machine:**
```bash
# In your local repo, temporarily set the Render DB URL
# (find it in Render → pulse-db → "External Database URL")
echo 'DATABASE_URL=postgresql://...render-db-url...' > .env
bun run db:push
bun run prisma/seed.ts
```

---

### Step 6: Connect the web app to the socket service (3 min)

The web app needs to know where the socket service lives.

1. In Render dashboard → click **`pulse-socket`** service → copy its URL
   (looks like `https://pulse-socket-xyz.onrender.com`)
2. Go to **`pulse-web`** service → **Environment** tab
3. Add/edit this variable:
   ```
   NEXT_PUBLIC_SOCKET_URL = https://pulse-socket-xyz.onrender.com
   ```
4. Save → Render auto-redeploys the web app

5. Do the reverse for the socket service:
   - Go to **`pulse-socket`** → **Environment**
   - Set:
   ```
   SOCKET_CORS_ORIGIN = https://pulse-web-xyz.onrender.com
   ```
   (use your actual `pulse-web` URL)
   - Save

---

### Step 7: Open your live app! 🎉

Visit your **`pulse-web` URL**:
```
https://pulse-web-xyz.onrender.com
```

✅ You should see the Pulse login screen at a clean URL — **no AI mentions anywhere**.

**Test it:**
- Enter a name + phone → log in
- Open the URL in a **second browser** (or incognito) as a different user
- Send a message → it appears instantly in the other browser

---

### Step 8: Verify health

Visit your health check endpoint:
```
https://pulse-web-xyz.onrender.com/api/health
```
Should return:
```json
{"status":"ok","db":"ok","app":"pulse","time":"..."}
```

---

## 🆓 Free tier limits (know this)

| Service | Free tier limit |
|---|---|
| Render web services | **Spin down after 15 min idle** (first request takes ~30s to wake up) |
| Render Postgres | **90 days free**, then deleted (upgrade to paid or re-create) |
| Bandwidth | 100 GB/month (plenty for a demo) |

**For a real launch**, upgrade `pulse-web` + `pulse-socket` to Render's **Starter plan ($7/month each)** — no spin-down, always fast. The database Starter is $7/month too. Total: ~₹1,700/month for a production-ready setup.

---

## 🌍 Optional: Add your own domain (later)

Once you're live on Render, you can add `pulse.yourdomain.com`:

1. Buy a domain (GoDaddy / Namecheap / Hostinger — ~₹500/year)
2. In Render → `pulse-web` → **Settings → Custom Domains** → add your domain
3. Render shows you DNS records to add at your registrar
4. Add them → wait 30 min → Render provisions free SSL

Now Pulse lives at **`https://pulse.yourdomain.com`** — fully yours.

---

## 🆘 Troubleshooting

**"Application error" on the web app?**
- Check `pulse-web` → Logs tab
- Usually means `DATABASE_URL` isn't set, or `db:push` wasn't run (Step 5)

**Messages don't appear in real-time?**
- You skipped Step 6 — `NEXT_PUBLIC_SOCKET_URL` must be set
- Check `pulse-socket` logs show `[socket] connected` when you open the app
- Verify `SOCKET_CORS_ORIGIN` matches your web URL exactly

**Build fails on Render?**
- Make sure you ran `switch-to-postgres.sh` (Step 2)
- Check that `bun` is in the build command (Render auto-detects, but verify)

**First request is slow (~30s)?**
- That's the free tier "cold start" — the service spun down from inactivity
- Upgrade to Starter plan ($7/mo) for always-on

---

## ✅ Checklist

- [ ] Repo pushed to GitHub
- [ ] Ran `switch-to-postgres.sh`
- [ ] Render account created
- [ ] Blueprint deployed (3 services created)
- [ ] `bun run db:push` + `bun run prisma/seed.ts` run
- [ ] `NEXT_PUBLIC_SOCKET_URL` set on `pulse-web`
- [ ] `SOCKET_CORS_ORIGIN` set on `pulse-socket`
- [ ] App loads at `https://pulse-web-xyz.onrender.com`
- [ ] Real-time messaging works (tested with 2 browsers)

Once all checked — **you have a live Pulse app at a clean URL.** 🎉
