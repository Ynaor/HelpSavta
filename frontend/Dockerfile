# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and configuration files
COPY . .

# Accept build-time environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application with Vite
RUN npm run build

# Production stage - Railway Static Files
FROM node:18-alpine AS production

# Install serve package globally for serving static files
RUN npm install -g serve

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Create app directory
WORKDIR /app

# Copy built files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port (Railway will map to dynamic port via PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/ || exit 1

# Start the application using serve
# Railway automatically sets PORT environment variable
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]