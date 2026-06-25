#!/usr/bin/env bash
# Switches Pulse's database from SQLite to PostgreSQL.
# Run this before deploying to Render/Vercel/Railway (they don't support SQLite files).
#
# Usage:  bash scripts/switch-to-postgres.sh
set -euo pipefail

SCHEMA="prisma/schema.prisma"

if [ ! -f "$SCHEMA" ]; then
  echo "✗ Cannot find $SCHEMA — run this from the project root."
  exit 1
fi

if grep -q 'provider = "sqlite"' "$SCHEMA"; then
  sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA"
  rm -f "$SCHEMA.bak"
  echo "✓ Switched $SCHEMA → PostgreSQL"
else
  echo "• $SCHEMA already uses PostgreSQL (or not SQLite). No change."
fi

echo ""
echo "Next steps:"
echo "  1. Set DATABASE_URL to your Postgres connection string in .env"
echo "  2. Run:  bun run db:generate   (regenerate Prisma client for Postgres)"
echo "  3. Run:  bun run db:push       (create tables in your Postgres DB)"
echo "  4. Run:  bun run prisma/seed.ts  (optional: load demo data)"
echo ""
echo "Free Postgres providers:"
echo "  - Render (included in render.yaml blueprint)"
echo "  - Neon    → https://neon.tech"
echo "  - Supabase → https://supabase.com"
