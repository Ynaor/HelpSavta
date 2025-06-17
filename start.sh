#!/bin/bash

# Help-Savta Development Startup Script
# עזרה טכנית בהתנדבות - סקריפט הפעלה לפיתוח

echo "🚀 Starting Help-Savta Development Environment"
echo "עזרה טכנית בהתנדבות - הפעלת סביבת פיתוח"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm is installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}✗ Backend directory not found${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}✗ Frontend directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}Checking ports...${NC}"

# Check if ports are available
if port_in_use 3001; then
    echo -e "${YELLOW}⚠ Port 3001 is already in use (Backend)${NC}"
    echo "Do you want to continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Port 3001 is available (Backend)${NC}"
fi

if port_in_use 5173; then
    echo -e "${YELLOW}⚠ Port 5173 is already in use (Frontend)${NC}"
    echo "Do you want to continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Port 5173 is available (Frontend)${NC}"
fi

echo -e "${BLUE}Checking dependencies...${NC}"

# Check backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠ Backend dependencies not installed${NC}"
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd backend && npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install backend dependencies${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${GREEN}✓ Backend dependencies are installed${NC}"
fi

# Check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠ Frontend dependencies not installed${NC}"
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend && npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${GREEN}✓ Frontend dependencies are installed${NC}"
fi

echo -e "${BLUE}Checking database setup...${NC}"

# Check backend .env file exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠ Backend .env file not found${NC}"
    echo -e "${BLUE}Creating .env file from .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env file${NC}"
    echo -e "${YELLOW}⚠ Please review and update backend/.env with your settings${NC}"
fi

# Setup database for local development (PostgreSQL)
echo -e "${BLUE}Setting up PostgreSQL database for local development...${NC}"
cd backend

# make sure postgres is running -  brew services start postgresql@15
if ! command_exists psql; then
    echo -e "${RED}✗ PostgreSQL is not installed. Please install PostgreSQL 15+${NC}"
    exit 1
fi
if ! psql postgres -c '\q' >/dev/null 2>&1; then
    echo -e "${RED}✗ PostgreSQL is not running. Please start PostgreSQL service${NC}"
    echo -e "${YELLOW}  You can start it with: brew services start postgresql@14${NC}"
    exit 1
fi


# Setup database schema and seed data
echo -e "${BLUE}Setting up database...${NC}"
npm run db:setup
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to setup database${NC}"
    echo -e "${YELLOW}  Make sure PostgreSQL is running and DATABASE_URL is correctly configured in .env${NC}"
    exit 1
fi

cd ..
echo -e "${GREEN}✓ Database setup completed${NC}"

echo -e "${BLUE}Starting development servers...${NC}"
echo ""
echo "🌐 Backend will be available at: http://localhost:3001"
echo "🖥️  Frontend will be available at: http://localhost:5173"
echo "🔍 API Health Check: http://localhost:3001/health"
echo ""

# Display admin credentials from .env file
if [ -f "backend/.env" ]; then
    ADMIN_USERNAME=$(grep "^DEFAULT_ADMIN_USERNAME=" backend/.env | cut -d'=' -f2)
    ADMIN_PASSWORD=$(grep "^DEFAULT_ADMIN_PASSWORD=" backend/.env | cut -d'=' -f2)
    echo "👤 Admin Credentials (for http://localhost:5173):"
    echo "   Username: ${ADMIN_USERNAME:-admin}"
    echo "   Password: ${ADMIN_PASSWORD:-admin123dev}"
else
    echo "👤 Admin Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123dev"
fi
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Final validation before starting servers
echo -e "${BLUE}Performing final validation...${NC}"

# Check if concurrently is installed
if [ ! -f "node_modules/.bin/concurrently" ]; then
    echo -e "${YELLOW}⚠ Installing root dependencies (including concurrently)...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install root dependencies${NC}"
        exit 1
    fi
fi

# Validate environment configuration
echo -e "${BLUE}Validating environment configuration...${NC}"
cd backend
if ! node -e "require('./src/config/environment.ts')" 2>/dev/null; then
    echo -e "${RED}✗ Environment configuration validation failed${NC}"
    echo -e "${YELLOW}  Please check your backend/.env file for any missing or invalid values${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✓ All validations passed${NC}"
echo ""
echo -e "${GREEN}🚀 Starting development servers...${NC}"

# Start both servers using concurrently
npm run dev

echo ""
echo -e "${BLUE}Development servers stopped${NC}"