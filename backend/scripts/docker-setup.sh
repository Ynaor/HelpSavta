#!/bin/sh

# Docker setup script for HelpSavta Backend
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Docker Setup for HelpSavta Backend ===${NC}"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Switch to PostgreSQL schema for Docker environment
if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "production" ]; then
    if echo "$DATABASE_URL" | grep -q "postgresql://"; then
        log "${BLUE}Switching to PostgreSQL schema for Docker environment...${NC}"
        
        # Copy PostgreSQL schema to main schema file
        if [ -f "./prisma/schema.postgresql.prisma" ]; then
            cp ./prisma/schema.postgresql.prisma ./prisma/schema.prisma
            log "${GREEN}✓ PostgreSQL schema activated${NC}"
        else
            log "${RED}✗ PostgreSQL schema file not found${NC}"
            exit 1
        fi
    else
        log "${YELLOW}Using existing schema (not PostgreSQL URL detected)${NC}"
    fi
fi

log "${GREEN}Docker setup completed successfully${NC}"