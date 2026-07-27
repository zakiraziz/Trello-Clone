#!/bin/sh
# =====================================================================
# Trello SaaS — Startup Script
# Runs nginx (frontend) and Node.js (backend) in the same container
# =====================================================================

set -e

# Export environment variables for the backend
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-5000}
export LOG_LEVEL=${LOG_LEVEL:-info}
export MAX_RETRIES=${MAX_RETRIES:-3}
export HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-30}

echo "======================================"
echo "  Trello SaaS Container Starting..."
echo "======================================"
echo "  Environment: $NODE_ENV"
echo "  Port: $PORT"
echo "  Log Level: $LOG_LEVEL"
echo "  Node: $(node --version)"
echo "  Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "======================================"

# Function to check if a service is healthy
check_health() {
    local service=$1
    local url=$2
    local max_attempts=10
    local attempt=1
    
    echo "Checking $service health..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f -o /dev/null "$url"; then
            echo "✓ $service is healthy (attempt $attempt)"
            return 0
        fi
        echo "  Waiting for $service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "✗ $service failed to start after $max_attempts attempts"
    return 1
}

# Function to handle graceful shutdown
cleanup() {
    echo "======================================"
    echo "  Received shutdown signal. Cleaning up..."
    echo "======================================"
    
    # Stop Node.js backend
    if [ -n "$NODE_PID" ] && kill -0 $NODE_PID 2>/dev/null; then
        echo "Stopping Node.js backend (PID: $NODE_PID)..."
        kill -TERM $NODE_PID 2>/dev/null || true
        wait $NODE_PID 2>/dev/null || true
        echo "Node.js backend stopped"
    fi
    
    # Stop nginx
    if [ -n "$NGINX_PID" ] && kill -0 $NGINX_PID 2>/dev/null; then
        echo "Stopping nginx (PID: $NGINX_PID)..."
        nginx -s quit 2>/dev/null || kill -TERM $NGINX_PID 2>/dev/null || true
        wait $NGINX_PID 2>/dev/null || true
        echo "nginx stopped"
    fi
    
    echo "Cleanup complete. Exiting."
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup TERM INT QUIT HUP

# Create log directory if it doesn't exist
mkdir -p /var/log/trello
mkdir -p /app/logs

# Start nginx with enhanced logging
echo "Starting nginx..."
nginx -g "daemon off;" \
    > /var/log/trello/nginx-access.log \
    2> /var/log/trello/nginx-error.log &
NGINX_PID=$!
echo "nginx started (PID: $NGINX_PID)"

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
if check_health "nginx" "http://localhost:80/health" 2>/dev/null; then
    echo "✓ nginx is ready"
else
    echo "⚠ nginx health check failed, but continuing..."
fi

# Start the Node.js backend with logging
echo "Starting Node.js backend..."
cd /app/backend

# Create a log rotation configuration if logrotate is available
if command -v logrotate >/dev/null 2>&1; then
    echo "Configuring log rotation..."
    cat > /etc/logrotate.d/trello << EOF
/var/log/trello/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \`cat /var/run/nginx.pid\` 2>/dev/null || true
    endscript
}
EOF
fi

# Start Node.js with retry logic
retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    echo "Starting Node.js (attempt $((retry_count + 1))/$MAX_RETRIES)..."
    
    # Run Node.js in the background with logging
    node src/server.js \
        > >(tee -a /var/log/trello/nodejs.log) \
        2> >(tee -a /var/log/trello/nodejs-error.log >&2) &
    NODE_PID=$!
    echo "Node.js started (PID: $NODE_PID)"
    
    # Wait a moment for Node.js to start
    sleep 3
    
    # Check if Node.js is still running
    if kill -0 $NODE_PID 2>/dev/null; then
        echo "✓ Node.js is running"
        
        # Check Node.js health endpoint
        if check_health "Node.js" "http://localhost:$PORT/health" 2>/dev/null; then
            echo "✓ Node.js is healthy"
            break
        else
            echo "⚠ Node.js health check failed, but continuing..."
            break
        fi
    else
        echo "✗ Node.js failed to start"
        retry_count=$((retry_count + 1))
        
        if [ $retry_count -lt $MAX_RETRIES ]; then
            echo "Retrying in 5 seconds..."
            sleep 5
        else
            echo "✗ Failed to start Node.js after $MAX_RETRIES attempts"
            exit 1
        fi
    fi
done

# Display process status
echo "======================================"
echo "  Service Status:"
echo "  ✓ nginx (PID: $NGINX_PID)"
if kill -0 $NODE_PID 2>/dev/null; then
    echo "  ✓ Node.js (PID: $NODE_PID)"
else
    echo "  ✗ Node.js (PID: $NODE_PID) - NOT RUNNING"
fi
echo "======================================"

# Function to monitor processes
monitor_processes() {
    while true; do
        # Check if nginx is still running
        if ! kill -0 $NGINX_PID 2>/dev/null; then
            echo "✗ nginx died unexpectedly!"
            cleanup
            exit 1
        fi
        
        # Check if Node.js is still running
        if ! kill -0 $NODE_PID 2>/dev/null; then
            echo "✗ Node.js died unexpectedly!"
            cleanup
            exit 1
        fi
        
        # Log health status periodically
        if [ $((SECONDS % $HEALTH_CHECK_INTERVAL)) -eq 0 ]; then
            echo "[$(date +'%Y-%m-%d %H:%M:%S')] Health check: OK"
        fi
        
        sleep 5
    done
}

# Start process monitoring
echo "Starting process monitoring (checking every $HEALTH_CHECK_INTERVAL seconds)..."
monitor_processes &

# Wait for all child processes
wait
