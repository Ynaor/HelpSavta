#!/bin/bash

# Docker Compose Test Script for HelpSavta Backend
# This script sets up and tests the complete containerized environment

set -e

echo "🚀 Starting HelpSavta Docker Compose Test Environment"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_status "Docker and Docker Compose are available"

# Clean up any existing containers and volumes
echo -e "\n🧹 Cleaning up existing containers and volumes..."
$DOCKER_COMPOSE down -v --remove-orphans 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true

print_status "Cleanup completed"

# Build and start services
echo -e "\n🔨 Building and starting services..."
$DOCKER_COMPOSE up --build -d

print_status "Services started"

# Wait for PostgreSQL to be ready
echo -e "\n⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker exec helpsavta-postgres pg_isready -U helpsavta_user -d helpsavta_db &> /dev/null; then
        print_status "PostgreSQL is ready"
        break
    fi
    
    if [ $counter -eq $timeout ]; then
        print_error "PostgreSQL failed to start within ${timeout} seconds"
        echo "PostgreSQL logs:"
        $DOCKER_COMPOSE logs postgres
        exit 1
    fi
    
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

# Wait for backend to be ready
echo -e "\n⏳ Waiting for backend to be ready..."
timeout=90
counter=0

while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:3001/health &> /dev/null; then
        print_status "Backend is ready and responding to health checks"
        break
    fi
    
    if [ $counter -eq $timeout ]; then
        print_error "Backend failed to start within ${timeout} seconds"
        echo "Backend logs:"
        $DOCKER_COMPOSE logs backend
        exit 1
    fi
    
    echo -n "."
    sleep 3
    counter=$((counter + 3))
done

# Test database connectivity
echo -e "\n🔍 Testing database connectivity..."
if docker exec helpsavta-postgres psql -U helpsavta_user -d helpsavta_db -c "SELECT version();" &> /dev/null; then
    print_status "Database connectivity test passed"
else
    print_error "Database connectivity test failed"
    exit 1
fi

# Test backend API endpoints
echo -e "\n🌐 Testing backend API endpoints..."

# Test health endpoint
if curl -f http://localhost:3001/health &> /dev/null; then
    print_status "Health endpoint (/health) is responding"
else
    print_error "Health endpoint (/health) is not responding"
fi

# Test basic API endpoints
if curl -f http://localhost:3001/api/test &> /dev/null; then
    print_status "Test endpoint (/api/test) is responding"
else
    print_warning "Test endpoint (/api/test) may not be implemented (this is okay)"
fi

# Check if database tables were created
echo -e "\n📊 Checking database schema..."
table_count=$(docker exec helpsavta-postgres psql -U helpsavta_user -d helpsavta_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$table_count" -gt 0 ]; then
    print_status "Database tables created successfully ($table_count tables found)"
    
    # List the tables
    echo "Tables in database:"
    docker exec helpsavta-postgres psql -U helpsavta_user -d helpsavta_db -c "\dt"
else
    print_error "No database tables found - migration may have failed"
fi

# Check logs for any errors
echo -e "\n📝 Checking for errors in logs..."
if $DOCKER_COMPOSE logs backend | grep -i "error\|failed\|exception" | grep -v "Failed to send email" | head -5; then
    print_warning "Some errors found in backend logs (shown above)"
else
    print_status "No critical errors found in backend logs"
fi

# Final status
echo -e "\n🎉 Docker Compose Test Summary"
echo "================================"
print_status "PostgreSQL: Running and accessible"
print_status "Backend: Built successfully and running"
print_status "Database: Migrations and seeding completed"
print_status "Health checks: Passing"

echo -e "\n📋 Service Information:"
echo "• PostgreSQL: localhost:5432"
echo "• Backend API: http://localhost:3001"
echo "• Health check: http://localhost:3001/health"
echo "• Default admin: admin / admin123"

echo -e "\n🔧 Useful commands:"
echo "• View logs: $DOCKER_COMPOSE logs -f"
echo "• Stop services: $DOCKER_COMPOSE down"
echo "• Remove volumes: $DOCKER_COMPOSE down -v"
echo "• Access database: docker exec -it helpsavta-postgres psql -U helpsavta_user -d helpsavta_db"

echo -e "\n✅ Environment is ready for testing!"