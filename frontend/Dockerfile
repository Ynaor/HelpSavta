# Frontend Dockerfile for HelpSavta
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Production image, copy all the files and run nginx
FROM nginx:alpine AS runner

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create a non-root user to own the files and run our server
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

# Change ownership of nginx directories and create necessary directories
RUN chown -R frontend:nodejs /var/cache/nginx && \
    chown -R frontend:nodejs /var/log/nginx && \
    chown -R frontend:nodejs /etc/nginx/conf.d && \
    chown -R frontend:nodejs /usr/share/nginx/html && \
    touch /run/nginx.pid && \
    chown frontend:nodejs /run/nginx.pid

# For nginx to work properly, we need to keep it running as root
# The non-root user setup is commented out for now
# USER frontend

# Expose the port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]