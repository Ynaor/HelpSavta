# Backend Dockerfile for HelpSavta
FROM node:22-alpine@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca AS base

# Install dependencies only when needed
FROM base AS deps
# Install necessary dependencies for Prisma and ARM64 compatibility
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    openssl-dev \
    ca-certificates \
    dumb-init \
    && update-ca-certificates

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies including dev dependencies for Prisma generation
RUN npm install && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
# Install build dependencies
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    ca-certificates

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .

# Generate Prisma client with binary targets for Alpine Linux
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
# Install runtime dependencies for Prisma
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init \
    netcat-openbsd \
    && update-ca-certificates

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built application
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/package.json ./package.json
COPY --from=builder --chown=backend:nodejs /app/prisma ./prisma

# Copy startup scripts
COPY --from=builder --chown=backend:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY --from=builder --chown=backend:nodejs /app/scripts/docker-setup.sh ./scripts/docker-setup.sh
RUN chmod +x ./scripts/docker-entrypoint.sh ./scripts/docker-setup.sh

# Copy healthcheck script
COPY --from=builder --chown=backend:nodejs /app/healthcheck.js ./healthcheck.js

USER backend

# Expose the port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application using dumb-init for proper signal handling
CMD ["dumb-init", "./scripts/docker-entrypoint.sh"]