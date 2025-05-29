#!/bin/bash

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
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
            log "${GREEN}✓ Database connection established${NC}"
            return 0
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

# Generate Prisma client if needed
log "${BLUE}Generating Prisma client...${NC}"
npx prisma generate

# Wait for dependencies
wait_for_db
wait_for_redis

# Run database migrations in production
if [ "$NODE_ENV" = "production" ]; then
    log "${BLUE}Running database migrations...${NC}"
    npx prisma migrate deploy
else
    log "${BLUE}Pushing database schema...${NC}"
    npx prisma db push --accept-data-loss
fi

# Seed database if SEED_DATABASE is set and seed file exists
if [ "$SEED_DATABASE" = "true" ] && [ -f "./prisma/seed.ts" ]; then
    log "${BLUE}Seeding database...${NC}"
    npx tsx ./prisma/seed.ts
fi

# Create uploads directory if it doesn't exist
mkdir -p ./uploads
chmod 755 ./uploads

# Create logs directory if it doesn't exist
mkdir -p ./logs
chmod 755 ./logs

# Set proper permissions for temp directory
mkdir -p ./temp
chmod 755 ./temp

# Start the application
log "${GREEN}Starting HelpSavta Backend...${NC}"

if [ "$NODE_ENV" = "development" ]; then
    # Development mode with hot reload
    exec npm run dev
else
    # Production mode
    exec node ./dist/server.js
fi