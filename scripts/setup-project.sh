#!/bin/bash

# HelpSavta Project Setup Script
# This script helps set up the development environment and prepares for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== HelpSavta Project Setup ===${NC}"
echo -e "Project Root: ${YELLOW}${PROJECT_ROOT}${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_dependencies() {
    log "${BLUE}Installing project dependencies...${NC}"
    
    # Backend dependencies
    if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
        log "Installing backend dependencies..."
        cd "$PROJECT_ROOT/backend"
        npm install
        cd "$PROJECT_ROOT"
        log "${GREEN}✓ Backend dependencies installed${NC}"
    fi
    
    # Frontend dependencies
    if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
        log "Installing frontend dependencies..."
        cd "$PROJECT_ROOT/frontend"
        npm install
        cd "$PROJECT_ROOT"
        log "${GREEN}✓ Frontend dependencies installed${NC}"
    fi
}

# Function to setup environment files
setup_environment_files() {
    log "${BLUE}Setting up environment files...${NC}"
    
    # Backend environment
    if [ ! -f "$PROJECT_ROOT/backend/.env" ] && [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
        cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
        log "${GREEN}✓ Created backend/.env from example${NC}"
        log "${YELLOW}Please edit backend/.env with your configuration${NC}"
    fi
    
    # Backend production environment
    if [ ! -f "$PROJECT_ROOT/backend/.env.production" ] && [ -f "$PROJECT_ROOT/backend/.env.production.example" ]; then
        cp "$PROJECT_ROOT/backend/.env.production.example" "$PROJECT_ROOT/backend/.env.production"
        log "${GREEN}✓ Created backend/.env.production from example${NC}"
        log "${YELLOW}Please edit backend/.env.production with your production configuration${NC}"
    fi
    
    # Deployment environment
    if [ ! -f "$PROJECT_ROOT/.env.deployment" ] && [ -f "$PROJECT_ROOT/.env.deployment.example" ]; then
        cp "$PROJECT_ROOT/.env.deployment.example" "$PROJECT_ROOT/.env.deployment"
        log "${GREEN}✓ Created .env.deployment from example${NC}"
        log "${YELLOW}Please edit .env.deployment with your Azure configuration${NC}"
    fi
}

# Function to setup database
setup_database() {
    log "${BLUE}Setting up database...${NC}"
    
    if command_exists docker-compose; then
        log "Starting development database with Docker..."
        cd "$PROJECT_ROOT"
        docker-compose up -d postgres redis
        
        # Wait for database to be ready
        log "Waiting for database to be ready..."
        sleep 10
        
        # Generate Prisma client and run migrations
        cd "$PROJECT_ROOT/backend"
        npx prisma generate
        npx prisma db push
        
        log "${GREEN}✓ Database setup completed${NC}"
        cd "$PROJECT_ROOT"
    else
        log "${YELLOW}Docker Compose not found. Please set up database manually.${NC}"
        log "Refer to DEPLOYMENT_INFRASTRUCTURE.md for database setup instructions."
    fi
}

# Function to run initial tests
run_tests() {
    log "${BLUE}Running initial tests...${NC}"
    
    # Backend tests
    if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
        cd "$PROJECT_ROOT/backend"
        if npm run test:unit > /dev/null 2>&1; then
            log "${GREEN}✓ Backend unit tests passed${NC}"
        else
            log "${YELLOW}⚠ Backend tests failed or not configured${NC}"
        fi
        cd "$PROJECT_ROOT"
    fi
    
    # Frontend tests
    if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
        cd "$PROJECT_ROOT/frontend"
        if npm test > /dev/null 2>&1; then
            log "${GREEN}✓ Frontend tests passed${NC}"
        else
            log "${YELLOW}⚠ Frontend tests failed or not configured${NC}"
        fi
        cd "$PROJECT_ROOT"
    fi
}

# Function to create necessary directories
create_directories() {
    log "${BLUE}Creating necessary directories...${NC}"
    
    # Backend directories
    mkdir -p "$PROJECT_ROOT/backend/logs"
    mkdir -p "$PROJECT_ROOT/backend/uploads"
    mkdir -p "$PROJECT_ROOT/backend/temp"
    
    # Backup directory
    mkdir -p "$PROJECT_ROOT/backups"
    
    # Monitoring configuration directories
    mkdir -p "$PROJECT_ROOT/monitoring"
    mkdir -p "$PROJECT_ROOT/nginx"
    mkdir -p "$PROJECT_ROOT/fluentd"
    
    log "${GREEN}✓ Directories created${NC}"
}

# Function to generate secrets for development
generate_dev_secrets() {
    log "${BLUE}Generating development secrets...${NC}"
    
    if command_exists openssl; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
        SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
        ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        
        log "Generated secrets for development environment:"
        log "JWT_SECRET=${JWT_SECRET}"
        log "SESSION_SECRET=${SESSION_SECRET}"
        log "ENCRYPTION_KEY=${ENCRYPTION_KEY}"
        
        # Append to .env file if it exists
        if [ -f "$PROJECT_ROOT/backend/.env" ]; then
            echo "" >> "$PROJECT_ROOT/backend/.env"
            echo "# Generated secrets ($(date))" >> "$PROJECT_ROOT/backend/.env"
            echo "JWT_SECRET=${JWT_SECRET}" >> "$PROJECT_ROOT/backend/.env"
            echo "SESSION_SECRET=${SESSION_SECRET}" >> "$PROJECT_ROOT/backend/.env"
            echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}" >> "$PROJECT_ROOT/backend/.env"
            log "${GREEN}✓ Secrets added to backend/.env${NC}"
        fi
    else
        log "${YELLOW}⚠ OpenSSL not found. Please generate secrets manually.${NC}"
    fi
}

# Main setup function
main() {
    log "${BLUE}Starting HelpSavta project setup...${NC}"
    
    # Check prerequisites
    log "${BLUE}Checking prerequisites...${NC}"
    
    if ! command_exists node; then
        log "${RED}✗ Node.js is not installed. Please install Node.js 18+ first.${NC}"
        exit 1
    fi
    
    if ! command_exists npm; then
        log "${RED}✗ npm is not installed. Please install npm first.${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ Prerequisites check passed${NC}"
    echo ""
    
    # Run setup steps
    create_directories
    setup_environment_files
    install_dependencies
    generate_dev_secrets
    
    # Optional database setup
    read -p "Would you like to set up the development database with Docker? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_database
    else
        log "${YELLOW}Skipping database setup. You can run 'docker-compose up -d' later.${NC}"
    fi
    
    # Optional test run
    read -p "Would you like to run initial tests? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    else
        log "${YELLOW}Skipping tests. You can run them later with 'npm test'.${NC}"
    fi
    
    echo ""
    log "${GREEN}=== Project setup completed! ===${NC}"
    echo ""
    log "${BLUE}Next steps:${NC}"
    log "1. Edit environment files with your configuration:"
    log "   - backend/.env"
    log "   - backend/.env.production"
    log "   - .env.deployment"
    echo ""
    log "2. Start the development environment:"
    log "   docker-compose up -d"
    echo ""
    log "3. Access the application:"
    log "   - Frontend: http://localhost:3000"
    log "   - Backend: http://localhost:3001"
    log "   - pgAdmin: http://localhost:5050"
    echo ""
    log "4. For production deployment, see DEPLOYMENT_INFRASTRUCTURE.md"
    echo ""
    log "${YELLOW}Important files to review:${NC}"
    log "- README.md - Project overview and local development"
    log "- DEPLOYMENT_INFRASTRUCTURE.md - Production deployment guide"
    log "- backend/.env - Backend configuration"
    log "- .env.deployment - Azure deployment configuration"
}

# Run main function
main "$@"