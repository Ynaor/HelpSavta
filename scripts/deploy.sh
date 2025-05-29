#!/bin/bash

# HelpSavta Deployment Script
# Usage: ./scripts/deploy.sh [environment] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DRY_RUN=${2:-}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}Error: Environment must be 'staging' or 'production'${NC}"
    exit 1
fi

# Set environment-specific variables
RESOURCE_GROUP="helpsavta-${ENVIRONMENT}-rg"
LOCATION="East US"
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID}"

echo -e "${BLUE}=== HelpSavta Deployment ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Resource Group: ${YELLOW}${RESOURCE_GROUP}${NC}"
echo -e "Location: ${YELLOW}${LOCATION}${NC}"

if [[ "$DRY_RUN" == "--dry-run" ]]; then
    echo -e "${YELLOW}DRY RUN MODE - No actual deployment will occur${NC}"
fi

echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to run command with dry-run support
run_cmd() {
    local cmd="$1"
    local description="$2"
    
    log "${BLUE}${description}${NC}"
    
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        echo -e "${YELLOW}[DRY RUN] Would execute: ${cmd}${NC}"
    else
        echo -e "${YELLOW}Executing: ${cmd}${NC}"
        eval "$cmd"
        if [[ $? -eq 0 ]]; then
            log "${GREEN}✓ ${description} completed successfully${NC}"
        else
            log "${RED}✗ ${description} failed${NC}"
            exit 1
        fi
    fi
    echo ""
}

# Check prerequisites
log "${BLUE}Checking prerequisites...${NC}"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    log "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log "${RED}Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

# Check if subscription is set
if [[ -z "$SUBSCRIPTION_ID" ]]; then
    log "${RED}AZURE_SUBSCRIPTION_ID environment variable is not set${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    log "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    log "${RED}Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

log "${GREEN}✓ All prerequisites satisfied${NC}"
echo ""

# Set Azure subscription
run_cmd "az account set --subscription ${SUBSCRIPTION_ID}" "Setting Azure subscription"

# Create resource group if it doesn't exist
run_cmd "az group create --name ${RESOURCE_GROUP} --location '${LOCATION}'" "Creating resource group"

# Build applications
log "${BLUE}Building applications...${NC}"

# Build backend
run_cmd "cd ${PROJECT_ROOT}/backend && npm ci && npm run build" "Building backend application"

# Build frontend
run_cmd "cd ${PROJECT_ROOT}/frontend && npm ci && npm run build" "Building frontend application"

# Build Docker images
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKEND_IMAGE="helpsavta-backend:${TIMESTAMP}"
FRONTEND_IMAGE="helpsavta-frontend:${TIMESTAMP}"

run_cmd "docker build -t ${BACKEND_IMAGE} ${PROJECT_ROOT}/backend" "Building backend Docker image"
run_cmd "docker build -t ${FRONTEND_IMAGE} ${PROJECT_ROOT}/frontend" "Building frontend Docker image"

# Deploy infrastructure
log "${BLUE}Deploying Azure infrastructure...${NC}"

DEPLOYMENT_NAME="helpsavta-deployment-${TIMESTAMP}"
BICEP_FILE="${PROJECT_ROOT}/azure/main.bicep"
PARAMS_FILE="${PROJECT_ROOT}/azure/parameters.${ENVIRONMENT}.json"

run_cmd "az deployment group create \
    --resource-group ${RESOURCE_GROUP} \
    --template-file ${BICEP_FILE} \
    --parameters @${PARAMS_FILE} \
    --name ${DEPLOYMENT_NAME}" "Deploying infrastructure with Bicep"

# Get deployment outputs
if [[ "$DRY_RUN" != "--dry-run" ]]; then
    log "${BLUE}Retrieving deployment outputs...${NC}"
    
    CONTAINER_REGISTRY=$(az deployment group show \
        --resource-group ${RESOURCE_GROUP} \
        --name ${DEPLOYMENT_NAME} \
        --query 'properties.outputs.containerRegistryLoginServer.value' \
        --output tsv)
    
    WEBAPP_NAME=$(az deployment group show \
        --resource-group ${RESOURCE_GROUP} \
        --name ${DEPLOYMENT_NAME} \
        --query 'properties.outputs.webAppName.value' \
        --output tsv)
    
    log "Container Registry: ${CONTAINER_REGISTRY}"
    log "Web App Name: ${WEBAPP_NAME}"
fi

# Push Docker images to Azure Container Registry
if [[ "$DRY_RUN" != "--dry-run" ]]; then
    log "${BLUE}Pushing Docker images to Azure Container Registry...${NC}"
    
    # Login to ACR
    run_cmd "az acr login --name ${CONTAINER_REGISTRY}" "Logging into Azure Container Registry"
    
    # Tag and push backend image
    run_cmd "docker tag ${BACKEND_IMAGE} ${CONTAINER_REGISTRY}/helpsavta-backend:latest" "Tagging backend image"
    run_cmd "docker tag ${BACKEND_IMAGE} ${CONTAINER_REGISTRY}/helpsavta-backend:${TIMESTAMP}" "Tagging backend image with timestamp"
    run_cmd "docker push ${CONTAINER_REGISTRY}/helpsavta-backend:latest" "Pushing backend image (latest)"
    run_cmd "docker push ${CONTAINER_REGISTRY}/helpsavta-backend:${TIMESTAMP}" "Pushing backend image (timestamped)"
    
    # Tag and push frontend image
    run_cmd "docker tag ${FRONTEND_IMAGE} ${CONTAINER_REGISTRY}/helpsavta-frontend:latest" "Tagging frontend image"
    run_cmd "docker tag ${FRONTEND_IMAGE} ${CONTAINER_REGISTRY}/helpsavta-frontend:${TIMESTAMP}" "Tagging frontend image with timestamp"
    run_cmd "docker push ${CONTAINER_REGISTRY}/helpsavta-frontend:latest" "Pushing frontend image (latest)"
    run_cmd "docker push ${CONTAINER_REGISTRY}/helpsavta-frontend:${TIMESTAMP}" "Pushing frontend image (timestamped)"
fi

# Run database migrations
log "${BLUE}Running database migrations...${NC}"

if [[ "$ENVIRONMENT" == "production" ]]; then
    run_cmd "${SCRIPT_DIR}/migrate-production.sh" "Running production database migrations"
else
    run_cmd "cd ${PROJECT_ROOT}/backend && npx prisma migrate deploy" "Running staging database migrations"
fi

# Deploy to Azure Web App staging slot
if [[ "$DRY_RUN" != "--dry-run" ]]; then
    log "${BLUE}Deploying to Azure Web App staging slot...${NC}"
    
    run_cmd "az webapp config container set \
        --name ${WEBAPP_NAME} \
        --resource-group ${RESOURCE_GROUP} \
        --slot staging \
        --docker-custom-image-name ${CONTAINER_REGISTRY}/helpsavta-backend:latest \
        --docker-registry-server-url https://${CONTAINER_REGISTRY}" "Updating staging slot container image"
    
    # Restart staging slot
    run_cmd "az webapp restart --name ${WEBAPP_NAME} --resource-group ${RESOURCE_GROUP} --slot staging" "Restarting staging slot"
    
    # Wait for deployment to complete
    log "Waiting 60 seconds for deployment to complete..."
    sleep 60
fi

# Run smoke tests
STAGING_URL="https://${WEBAPP_NAME}-staging.azurewebsites.net"
run_cmd "${SCRIPT_DIR}/smoke-tests.sh ${STAGING_URL}" "Running smoke tests on staging slot"

# Production swap (only for production environment)
if [[ "$ENVIRONMENT" == "production" ]]; then
    log "${BLUE}Swapping staging slot to production...${NC}"
    
    if [[ "$DRY_RUN" != "--dry-run" ]]; then
        read -p "Are you sure you want to swap to production? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_cmd "az webapp deployment slot swap \
                --resource-group ${RESOURCE_GROUP} \
                --name ${WEBAPP_NAME} \
                --slot staging \
                --target-slot production" "Swapping staging to production"
            
            # Wait and verify production
            log "Waiting 30 seconds for production swap to complete..."
            sleep 30
            
            PRODUCTION_URL="https://${WEBAPP_NAME}.azurewebsites.net"
            run_cmd "${SCRIPT_DIR}/smoke-tests.sh ${PRODUCTION_URL}" "Running smoke tests on production"
        else
            log "${YELLOW}Production swap cancelled by user${NC}"
        fi
    fi
fi

# Cleanup old Docker images
log "${BLUE}Cleaning up local Docker images...${NC}"
run_cmd "docker rmi ${BACKEND_IMAGE} ${FRONTEND_IMAGE} || true" "Removing local Docker images"

log "${GREEN}=== Deployment completed successfully! ===${NC}"

if [[ "$DRY_RUN" != "--dry-run" ]]; then
    echo ""
    log "${BLUE}Deployment Summary:${NC}"
    log "Environment: ${ENVIRONMENT}"
    log "Resource Group: ${RESOURCE_GROUP}"
    log "Web App: ${WEBAPP_NAME}"
    log "Staging URL: ${STAGING_URL}"
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Production URL: https://${WEBAPP_NAME}.azurewebsites.net"
    fi
    log "Container Registry: ${CONTAINER_REGISTRY}"
    log "Deployment Name: ${DEPLOYMENT_NAME}"
fi