# =====================================================================
# Trello SaaS — Root Dockerfile for Back4app / Single Container Deploy
# =====================================================================

# ---------- Stage 1: Build Frontend ----------
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY Frontend/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy frontend source code
COPY Frontend/ ./

# Build the static files
RUN npm run build

# ---------- Stage 2: Build Backend ----------
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY Backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy backend source code
COPY Backend/ ./

# ---------- Stage 3: Production Runtime ----------
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

# Create required directories
RUN mkdir -p /run/nginx /var/lib/nginx /var/log/nginx /app

# Copy backend from backend-builder
COPY --from=backend-builder /app /app/backend

# Copy frontend build from frontend-builder
COPY --from=frontend-builder /app/dist /app/frontend

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports: 80 (nginx/frontend), 5000 (backend API)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:80/api/health || exit 1

# Start nginx and the backend
CMD ["/start.sh"]