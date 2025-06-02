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

# Build the application with Vite
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install curl and envsubst for healthcheck and dynamic configuration
RUN apk add --no-cache curl gettext

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx configuration template that supports dynamic PORT
COPY <<EOF /etc/nginx/conf.d/default.conf.template
server {
    listen \${PORT:-80};
    listen [::]:\${PORT:-80};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enhanced error logging for debugging
    error_log /var/log/nginx/error.log debug;
    access_log /var/log/nginx/access.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Handle static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # Handle all routes for SPA
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache control for HTML files
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Health check endpoint - Railway compatible format
    location /health {
        access_log off;
        return 200 '{"status":"ok","timestamp":"\$time_iso8601","port":"\${PORT:-80}"}';
        add_header Content-Type application/json;
    }

    # Alternative health check endpoint
    location /healthz {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # Handle API requests (proxy to backend if needed)
    location /api/ {
        # This would typically proxy to backend
        # For now, return 404 as API should be accessed directly
        return 404;
    }
}
EOF

# Create startup script for dynamic configuration and enhanced logging
COPY <<EOF /docker-entrypoint.sh
#!/bin/sh
set -e

# Enhanced logging for debugging
echo "=== Frontend Container Starting ==="
echo "Timestamp: \$(date)"
echo "PORT environment variable: \${PORT:-not-set}"
echo "All environment variables:"
env | sort

# Set default port if not provided by Railway
export PORT=\${PORT:-80}
echo "Using PORT: \$PORT"

# Generate nginx config from template with actual PORT value
echo "Generating nginx configuration..."
envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Generated nginx configuration:"
cat /etc/nginx/conf.d/default.conf

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Create log directory and set permissions
mkdir -p /var/log/nginx
chmod 755 /var/log/nginx

# Function to handle graceful shutdown
shutdown_handler() {
    echo "=== Received shutdown signal ==="
    echo "Timestamp: \$(date)"
    echo "Signal received, shutting down nginx gracefully..."
    nginx -s quit
    exit 0
}

# Set up signal handlers
trap 'shutdown_handler' TERM INT QUIT

echo "=== Starting nginx ==="
echo "Listening on port: \$PORT"
echo "Health check available at: http://localhost:\$PORT/health"

# Start nginx in foreground
exec nginx -g "daemon off;"
EOF

# Make startup script executable
RUN chmod +x /docker-entrypoint.sh

# Expose port 80 (Railway will map to dynamic port)
EXPOSE 80

# Enhanced healthcheck that works with dynamic port
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:${PORT:-80}/health || curl -f http://localhost:${PORT:-80}/healthz || exit 1

# Use custom entrypoint for enhanced logging and dynamic configuration
ENTRYPOINT ["/docker-entrypoint.sh"]