#!/bin/sh
# =====================================================================
# Trello SaaS — Startup Script
# Runs nginx (frontend) and Node.js (backend) in the same container
# =====================================================================

set -e

# Export environment variables for the backend
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-5000}

echo "======================================"
echo "  Trello SaaS Container Starting..."
echo "======================================"
echo "  Environment: $NODE_ENV"
echo "  Port: $PORT"
echo "  Node: $(node --version)"
echo "======================================"

# Use production database pool if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "Using production PostgreSQL database"
    cd /app/backend
    # Replace mock pool with production pool
    if [ -f "src/db/pool.prod.js" ]; then
        cp src/db/pool.prod.js src/db/pool.js
    fi
else
    echo "WARNING: DATABASE_URL not set, using in-memory database"
fi

# Start nginx in the background
echo "Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!
echo "nginx started (PID: $NGINX_PID)"

# Give nginx a moment to start
sleep 1

# Start the Node.js backend
echo "Starting Node.js backend..."
cd /app/backend
exec node src/server.js