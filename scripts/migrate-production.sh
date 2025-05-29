#!/bin/bash

# Production Database Migration Script
# Usage: ./scripts/migrate-production.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}=== Production Database Migration ===${NC}"
echo -e "Timestamp: ${YELLOW}${TIMESTAMP}${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to exit with error
exit_with_error() {
    log "${RED}$1${NC}"
    exit 1
}

# Check prerequisites
log "${BLUE}Checking prerequisites...${NC}"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    exit_with_error "Azure CLI is not installed. Please install it first."
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    exit_with_error "Not logged in to Azure. Please run 'az login' first."
fi

# Check Node.js and npm
if ! command -v node &> /dev/null; then
    exit_with_error "Node.js is not installed. Please install it first."
fi

if ! command -v npx &> /dev/null; then
    exit_with_error "npx is not available. Please install Node.js properly."
fi

# Check PostgreSQL client tools
if ! command -v pg_dump &> /dev/null; then
    log "${YELLOW}Warning: pg_dump not found. Database backup will be skipped.${NC}"
    SKIP_BACKUP=true
else
    SKIP_BACKUP=false
fi

log "${GREEN}✓ Prerequisites check completed${NC}"
echo ""

# Get production environment variables
log "${BLUE}Retrieving production configuration...${NC}"

RESOURCE_GROUP="helpsavta-production-rg"
KEY_VAULT_NAME="helpsavta-production-kv"
WEBAPP_NAME="helpsavta-production-backend"

# Get database connection details from Key Vault
DATABASE_URL=$(az keyvault secret show \
    --vault-name "$KEY_VAULT_NAME" \
    --name "database-url" \
    --query value \
    --output tsv)

if [[ -z "$DATABASE_URL" ]]; then
    exit_with_error "Could not retrieve database URL from Key Vault"
fi

log "${GREEN}✓ Configuration retrieved successfully${NC}"
echo ""

# Parse database URL for backup
if [[ "$SKIP_BACKUP" == false ]]; then
    log "${BLUE}Parsing database connection details...${NC}"
    
    # Extract components from DATABASE_URL
    # Format: postgresql://username:password@host:port/database?sslmode=require
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/postgresql:\/\/[^@]*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/postgresql:\/\/[^@]*@[^:]*:\([^\/]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/postgresql:\/\/[^\/]*\/\([^?]*\).*/\1/p')
    
    log "Database: ${DB_NAME}"
    log "Host: ${DB_HOST}"
    log "Port: ${DB_PORT}"
    log "User: ${DB_USER}"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current database
if [[ "$SKIP_BACKUP" == false ]]; then
    log "${BLUE}Creating database backup...${NC}"
    
    BACKUP_FILE="$BACKUP_DIR/production-backup-$TIMESTAMP.sql"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        --file="$BACKUP_FILE"
    
    if [[ $? -eq 0 ]]; then
        log "${GREEN}✓ Database backup created: $BACKUP_FILE${NC}"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        log "${GREEN}✓ Backup compressed: $BACKUP_FILE.gz${NC}"
        
        # Upload backup to Azure Storage (if configured)
        STORAGE_ACCOUNT=$(az keyvault secret show \
            --vault-name "$KEY_VAULT_NAME" \
            --name "storage-account-name" \
            --query value \
            --output tsv 2>/dev/null || echo "")
        
        if [[ -n "$STORAGE_ACCOUNT" ]]; then
            log "${BLUE}Uploading backup to Azure Storage...${NC}"
            
            az storage blob upload \
                --account-name "$STORAGE_ACCOUNT" \
                --container-name "database-backups" \
                --name "production-backup-$TIMESTAMP.sql.gz" \
                --file "$BACKUP_FILE.gz" \
                --auth-mode login
            
            if [[ $? -eq 0 ]]; then
                log "${GREEN}✓ Backup uploaded to Azure Storage${NC}"
            else
                log "${YELLOW}Warning: Failed to upload backup to Azure Storage${NC}"
            fi
        fi
    else
        exit_with_error "Database backup failed!"
    fi
else
    log "${YELLOW}Skipping database backup (pg_dump not available)${NC}"
fi

echo ""

# Prompt for confirmation
log "${YELLOW}⚠️  WARNING: You are about to run database migrations on PRODUCTION!${NC}"
log "${YELLOW}This operation may modify your production database schema.${NC}"
echo ""
read -p "Are you sure you want to continue? Type 'MIGRATE PRODUCTION' to confirm: " -r
echo ""

if [[ "$REPLY" != "MIGRATE PRODUCTION" ]]; then
    log "${YELLOW}Migration cancelled by user.${NC}"
    exit 0
fi

# Set environment variables for migration
export DATABASE_URL="$DATABASE_URL"
export NODE_ENV="production"

# Change to backend directory
cd "$PROJECT_ROOT/backend"

# Check for pending migrations
log "${BLUE}Checking for pending migrations...${NC}"

MIGRATION_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "No pending migrations"; then
    log "${GREEN}✓ No pending migrations found${NC}"
    echo ""
    log "${BLUE}Database is up to date. Migration completed successfully!${NC}"
    exit 0
fi

if echo "$MIGRATION_STATUS" | grep -q "following migration"; then
    log "${YELLOW}Pending migrations found:${NC}"
    echo "$MIGRATION_STATUS"
    echo ""
else
    log "${YELLOW}Migration status:${NC}"
    echo "$MIGRATION_STATUS"
    echo ""
fi

# Run migrations
log "${BLUE}Running database migrations...${NC}"

# Generate Prisma client (ensure it's up to date)
npx prisma generate --schema=./prisma/schema.prisma

# Deploy migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma

if [[ $? -eq 0 ]]; then
    log "${GREEN}✓ Database migrations completed successfully!${NC}"
else
    log "${RED}✗ Database migrations failed!${NC}"
    
    # Offer to restore from backup
    if [[ "$SKIP_BACKUP" == false && -f "$BACKUP_FILE.gz" ]]; then
        echo ""
        log "${YELLOW}A backup was created before migration: $BACKUP_FILE.gz${NC}"
        read -p "Would you like to restore from backup? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "${BLUE}Restoring database from backup...${NC}"
            
            # Decompress backup
            gunzip -c "$BACKUP_FILE.gz" > "${BACKUP_FILE}.restore"
            
            # Restore database
            PGPASSWORD="$DB_PASSWORD" psql \
                --host="$DB_HOST" \
                --port="$DB_PORT" \
                --username="$DB_USER" \
                --dbname="$DB_NAME" \
                --file="${BACKUP_FILE}.restore"
            
            if [[ $? -eq 0 ]]; then
                log "${GREEN}✓ Database restored from backup${NC}"
                rm "${BACKUP_FILE}.restore"
            else
                log "${RED}✗ Database restore failed!${NC}"
            fi
        fi
    fi
    
    exit 1
fi

# Verify migration
log "${BLUE}Verifying migration...${NC}"

FINAL_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 || true)

if echo "$FINAL_STATUS" | grep -q "No pending migrations"; then
    log "${GREEN}✓ Migration verification successful${NC}"
else
    log "${YELLOW}Warning: Migration verification shows unexpected status:${NC}"
    echo "$FINAL_STATUS"
fi

# Run optional data seeding for production (if seed file exists and flag is set)
if [[ -f "./prisma/seed.production.ts" && "$SEED_PRODUCTION" == "true" ]]; then
    log "${BLUE}Running production data seeding...${NC}"
    
    npx tsx ./prisma/seed.production.ts
    
    if [[ $? -eq 0 ]]; then
        log "${GREEN}✓ Production data seeding completed${NC}"
    else
        log "${YELLOW}Warning: Production data seeding failed${NC}"
    fi
fi

# Update application with latest migrations
log "${BLUE}Restarting application to apply changes...${NC}"

az webapp restart \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP"

if [[ $? -eq 0 ]]; then
    log "${GREEN}✓ Application restarted successfully${NC}"
else
    log "${YELLOW}Warning: Failed to restart application automatically${NC}"
fi

# Wait for app to be ready
log "${BLUE}Waiting for application to be ready...${NC}"
sleep 30

# Test database connectivity
log "${BLUE}Testing database connectivity...${NC}"

APP_URL="https://$WEBAPP_NAME.azurewebsites.net"
HEALTH_CHECK_URL="$APP_URL/health"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")

if [[ "$HTTP_STATUS" == "200" ]]; then
    log "${GREEN}✓ Application health check passed${NC}"
else
    log "${YELLOW}Warning: Application health check returned status $HTTP_STATUS${NC}"
    log "URL: $HEALTH_CHECK_URL"
fi

echo ""
log "${GREEN}=== Production Database Migration Completed ===${NC}"
echo ""
log "${BLUE}Migration Summary:${NC}"
log "Timestamp: $TIMESTAMP"
log "Database: $DB_NAME"
log "Host: $DB_HOST"
if [[ "$SKIP_BACKUP" == false ]]; then
    log "Backup: $BACKUP_FILE.gz"
fi
log "Application: $APP_URL"
echo ""
log "${BLUE}Post-migration checklist:${NC}"
log "□ Verify application functionality"
log "□ Check application logs"
log "□ Monitor database performance"
log "□ Validate critical user flows"
log "□ Archive backup file"
echo ""
log "${YELLOW}Backup retention: Keep the backup file for at least 30 days${NC}"