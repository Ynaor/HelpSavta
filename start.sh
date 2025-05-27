#!/bin/bash

# TechHelp4U Development Startup Script
# עזרה טכנית בהתנדבות - סקריפט הפעלה לפיתוח

echo "🚀 Starting TechHelp4U Development Environment"
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

echo -e "${BLUE}Checking database...${NC}"

# Check if database exists
if [ ! -f "backend/dev.db" ]; then
    echo -e "${YELLOW}⚠ Database not found${NC}"
    echo -e "${BLUE}Setting up database...${NC}"
    cd backend
    npm run db:generate
    npm run db:push
    npm run db:seed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database setup completed${NC}"
    else
        echo -e "${RED}✗ Failed to setup database${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${GREEN}✓ Database exists${NC}"
fi

echo -e "${BLUE}Starting development servers...${NC}"
echo ""
echo "Backend will be available at: http://localhost:3001"
echo "Frontend will be available at: http://localhost:5173"
echo "API Health Check: http://localhost:3001/health"
echo ""
echo "Admin Credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Start both servers using concurrently
npm run dev

echo -e "${BLUE}Development servers stopped${NC}"