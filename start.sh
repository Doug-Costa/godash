#!/bin/sh

# Graceful shutdown handler
cleanup() {
  echo "Stopping services..."
  kill -TERM "$PID_SERVER" 2>/dev/null
  kill -TERM "$PID_WORKER" 2>/dev/null
  wait "$PID_SERVER" 2>/dev/null
  wait "$PID_WORKER" 2>/dev/null
  echo "Services stopped."
  exit 0
}

# Trap termination signals
trap cleanup TERM INT

echo "🚀 Starting Next.js Standalone Server..."
node server.js &
PID_SERVER=$!

echo "🚀 Starting BullMQ Worker..."
npx tsx src/lib/queue/postSalesWorker.ts &
PID_WORKER=$!

# Wait for both processes
wait "$PID_SERVER"
wait "$PID_WORKER"
