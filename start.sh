#!/bin/sh

# Graceful shutdown handler
cleanup() {
  echo "Stopping services..."
  kill -TERM "$PID_SERVER" 2>/dev/null
  kill -TERM "$PID_WORKER" 2>/dev/null
  kill -TERM "$PID_SYNC_WORKER" 2>/dev/null
  kill -TERM "$PID_MAIL_WORKER" 2>/dev/null
  kill -TERM "$PID_AUTO_WORKER" 2>/dev/null
  wait "$PID_SERVER" 2>/dev/null
  wait "$PID_WORKER" 2>/dev/null
  wait "$PID_SYNC_WORKER" 2>/dev/null
  wait "$PID_MAIL_WORKER" 2>/dev/null
  wait "$PID_AUTO_WORKER" 2>/dev/null
  echo "Services stopped."
  exit 0
}

# Trap termination signals
trap cleanup TERM INT

echo "⚙️ Syncing database schema with Prisma..."
MAX_RETRIES=30
RETRIES=0
until npx prisma db push --accept-data-loss || [ $RETRIES -eq $MAX_RETRIES ]; do
  echo "Prisma sync failed (Postgres might not be ready yet) - retrying in 2 seconds ($RETRIES/$MAX_RETRIES)..."
  sleep 2
  RETRIES=$((RETRIES + 1))
done

echo "🌱 Semeando Cursos e Aliases Oficiais..."
npx tsx prisma/seed-courses.ts || echo "Seed de cursos finalizado ou já existente."

echo "🚀 Starting Next.js Standalone Server..."
node server.js &
PID_SERVER=$!

echo "🚀 Starting BullMQ PostSales Worker..."
npx tsx src/lib/queue/postSalesWorker.ts &
PID_WORKER=$!

echo "🚀 Starting BullMQ Customer Sync Worker..."
npx tsx src/lib/queue/syncWorker.ts &
PID_SYNC_WORKER=$!

echo "🚀 Starting BullMQ Mail Campaign Worker..."
npx tsx src/lib/queue/mailWorker.ts &
PID_MAIL_WORKER=$!

echo "🚀 Starting BullMQ Automation Worker..."
npx tsx src/lib/queue/automationWorker.ts &
PID_AUTO_WORKER=$!

# Wait for all processes
wait "$PID_SERVER"
wait "$PID_WORKER"
wait "$PID_SYNC_WORKER"
wait "$PID_MAIL_WORKER"
wait "$PID_AUTO_WORKER"
