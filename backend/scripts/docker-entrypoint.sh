#!/bin/sh

# Docker entrypoint script for HelpSavta Backend
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== HelpSavta Backend Starting ===${NC}"
echo -e "Node Environment: ${YELLOW}${NODE_ENV:-development}${NC}"
echo -e "Port: ${YELLOW}${PORT:-3001}${NC}"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to wait for database
wait_for_db() {
    log "${BLUE}Waiting for database connection...${NC}"
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Check if DATABASE_URL contains postgres
        if echo "$DATABASE_URL" | grep -q "postgresql://"; then
            # Extract host and port from PostgreSQL URL
            local db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
            local db_port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
            
            if nc -z "$db_host" "$db_port" > /dev/null 2>&1; then
                log "${GREEN}✓ Database connection established${NC}"
                return 0
            fi
        else
            # For SQLite or other databases, just check if we can connect
            if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
                log "${GREEN}✓ Database connection established${NC}"
                return 0
            fi
        fi
        
        log "${YELLOW}Attempt $attempt/$max_attempts failed, retrying in 2 seconds...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "${RED}✗ Failed to connect to database after $max_attempts attempts${NC}"
    return 1
}

# Function to wait for Redis
wait_for_redis() {
    if [ -n "$REDIS_URL" ]; then
        log "${BLUE}Waiting for Redis connection...${NC}"
        
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            # Extract Redis connection details from URL
            local redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p' || echo "localhost")
            local redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\)$/\1/p' || echo "6379")
            
            if nc -z "$redis_host" "$redis_port" > /dev/null 2>&1; then
                log "${GREEN}✓ Redis connection established${NC}"
                return 0
            fi
            
            log "${YELLOW}Attempt $attempt/$max_attempts failed, retrying in 2 seconds...${NC}"
            sleep 2
            attempt=$((attempt + 1))
        done
        
        log "${YELLOW}⚠ Redis connection failed, continuing without cache${NC}"
    fi
    
    return 0
}

# Run Docker-specific setup first
if [ -f "./scripts/docker-setup.sh" ]; then
    log "${BLUE}Running Docker setup...${NC}"
    chmod +x ./scripts/docker-setup.sh
    ./scripts/docker-setup.sh
fi

# Generate Prisma client with proper binary targets
log "${BLUE}Generating Prisma client...${NC}"
npx prisma generate

# Wait for database and Redis
wait_for_db
wait_for_redis

# Setup database schema if needed
log "${BLUE}Setting up database schema...${NC}"
if npx prisma db push --accept-data-loss; then
    log "${GREEN}✓ Database schema synchronized${NC}"
else
    log "${YELLOW}⚠ Database schema setup failed, continuing anyway${NC}"
fi

# Run database seeding if needed
if [ "$NODE_ENV" = "development" ] && [ -f "./prisma/seed.ts" ]; then
    log "${BLUE}Running database seed...${NC}"
    if npm run db:seed > /dev/null 2>&1; then
        log "${GREEN}✓ Database seeded successfully${NC}"
    else
        log "${YELLOW}⚠ Database seeding failed or not needed${NC}"
    fi
fi

# Create directories if they don't exist (skip permissions for now since we're running as non-root)
mkdir -p ./uploads 2>/dev/null || true
mkdir -p ./logs 2>/dev/null || true
mkdir -p ./temp 2>/dev/null || true

# Start the application
log "${GREEN}Starting HelpSavta Backend...${NC}"

if [ "$NODE_ENV" = "development" ]; then
    # Development mode with hot reload
    exec npm run dev
else
    # Production mode
    exec node ./dist/server.js
fi