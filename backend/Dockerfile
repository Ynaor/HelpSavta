# Use Node.js 18+ alpine image for smaller size
FROM node:18-alpine AS base

# Install dependencies needed for native packages and Prisma
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# Development stage for building
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY src ./src/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

RUN apk add --no-cache libc6-compat openssl curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

WORKDIR /app

# Copy production dependencies from base stage
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nodejs:nodejs /app/package*.json ./

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema for runtime
COPY --chown=nodejs:nodejs prisma ./prisma/

# Copy email templates and other assets
COPY --chown=nodejs:nodejs src/templates ./src/templates/

# Copy startup script
COPY --chown=nodejs:nodejs start.sh ./start.sh
RUN chmod +x start.sh

# Switch to non-root user
USER nodejs

# Expose port 3001
EXPOSE 3001

# Add healthcheck using the /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application using startup script
CMD ["./start.sh"]