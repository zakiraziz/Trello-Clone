# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY Backend/package*.json ./Backend/
COPY Frontend/package*.json ./Frontend/

# Install dependencies
RUN cd Backend && npm ci --only=production
RUN cd Frontend && npm ci

# Copy source code
COPY Backend ./Backend
COPY Frontend ./Frontend
COPY Database ./Database
COPY start.sh ./start.sh

# Build frontend
RUN cd Frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built frontend from builder
COPY --from=builder --chown=nodejs:nodejs /app/Frontend/dist ./Frontend/dist

# Copy backend dependencies and source
COPY --from=builder --chown=nodejs:nodejs /app/Backend/node_modules ./Backend/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/Backend/src ./Backend/src
COPY --from=builder --chown=nodejs:nodejs /app/Backend/package*.json ./Backend/
COPY --from=builder --chown=nodejs:nodejs /app/Database ./Database
COPY --from=builder --chown=nodejs:nodejs /app/start.sh ./start.sh

# Switch to non-root user
USER nodejs

# Expose port
 EXPOSE 3001 5000

# Health check
 HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
   CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start application
 ENTRYPOINT ["dumb-init", "--"]
 CMD ["node", "Backend/src/server.js"]