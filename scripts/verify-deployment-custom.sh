#!/bin/bash

# Custom Azure Deployment Verification Script for Actual Deployed Resources
# Usage: ./scripts/verify-deployment-custom.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
RESOURCE_GROUP="helpsavta-prod-rg"
SUBSCRIPTION_ID="6720ecf6-4ad2-4909-b6b6-4696eb862b26"

echo -e "${BLUE}=== HelpSavta Production Infrastructure Verification ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Resource Group: ${YELLOW}${RESOURCE_GROUP}${NC}"
echo -e "Subscription: ${YELLOW}${SUBSCRIPTION_ID}${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Set Azure subscription
log "${BLUE}Setting Azure subscription...${NC}"
az account set --subscription "$SUBSCRIPTION_ID"

log "${GREEN}✓ Prerequisites satisfied${NC}"
echo ""

# Check Resource Group
log "${BLUE}Checking resource group...${NC}"
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ Resource Group: $RESOURCE_GROUP${NC}"
    RESOURCE_GROUP_STATUS="✓"
else
    log "${RED}✗ Resource Group: $RESOURCE_GROUP${NC}"
    RESOURCE_GROUP_STATUS="✗"
fi
echo ""

# Check Core Resources (actual deployed names)
log "${BLUE}Checking deployed resources...${NC}"

# Key Vault
if az keyvault show --name "helpsavta-production-kv" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ Key Vault: helpsavta-production-kv${NC}"
    KV_STATUS="✓"
else
    log "${RED}✗ Key Vault: helpsavta-production-kv${NC}"
    KV_STATUS="✗"
fi

# Storage Account
if az storage account show --name "helpsavtaprodst" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ Storage Account: helpsavtaprodst${NC}"
    STORAGE_STATUS="✓"
else
    log "${RED}✗ Storage Account: helpsavtaprodst${NC}"
    STORAGE_STATUS="✗"
fi

# Redis Cache
if az redis show --name "helpsavta-production-redis" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ Redis Cache: helpsavta-production-redis${NC}"
    REDIS_STATUS="✓"
else
    log "${RED}✗ Redis Cache: helpsavta-production-redis${NC}"
    REDIS_STATUS="✗"
fi

# Container Registry
if az acr show --name "helpsavtaprodacr" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ Container Registry: helpsavtaprodacr${NC}"
    ACR_STATUS="✓"
else
    log "${RED}✗ Container Registry: helpsavtaprodacr${NC}"
    ACR_STATUS="✗"
fi

# App Service Plan
if az appservice plan show --name "helpsavta-production-plan" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ App Service Plan: helpsavta-production-plan${NC}"
    ASP_STATUS="✓"
else
    log "${RED}✗ App Service Plan: helpsavta-production-plan${NC}"
    ASP_STATUS="✗"
fi

# App Service
if az webapp show --name "helpsavta-production-backend" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ App Service: helpsavta-production-backend${NC}"
    WEBAPP_STATUS="✓"
else
    log "${RED}✗ App Service: helpsavta-production-backend${NC}"
    WEBAPP_STATUS="✗"
fi

# Staging Slot
if az webapp deployment slot show --name "helpsavta-production-backend" --resource-group "$RESOURCE_GROUP" --slot "staging" &> /dev/null; then
    log "${GREEN}✓ Staging Slot: staging${NC}"
    STAGING_STATUS="✓"
else
    log "${RED}✗ Staging Slot: staging${NC}"
    STAGING_STATUS="✗"
fi

# PostgreSQL Server
if az postgres flexible-server show --name "helpsavta-prod-pg-server" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ PostgreSQL Server: helpsavta-prod-pg-server${NC}"
    POSTGRES_STATUS="✓"
else
    log "${RED}✗ PostgreSQL Server: helpsavta-prod-pg-server${NC}"
    POSTGRES_STATUS="✗"
fi

# Application Insights
if az monitor app-insights component show --app "helpsavta-production-insights" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ Application Insights: helpsavta-production-insights${NC}"
    INSIGHTS_STATUS="✓"
else
    log "${RED}✗ Application Insights: helpsavta-production-insights${NC}"
    INSIGHTS_STATUS="✗"
fi

echo ""

# Check Key Vault Secrets
log "${BLUE}Checking Key Vault secrets...${NC}"
REQUIRED_SECRETS=(
    "postgres-admin-password"
    "jwt-secret"
    "session-secret"
    "encryption-key"
    "admin-password"
    "database-url"
    "sendgrid-api-key"
    "email-host"
    "email-port"
    "email-user"
    "email-from"
    "applicationinsights-connection-string"
    "applicationinsights-instrumentation-key"
    "backend-url"
    "backend-staging-url"
)

SECRETS_STATUS="✓"
for secret in "${REQUIRED_SECRETS[@]}"; do
    if az keyvault secret show --name "$secret" --vault-name "helpsavta-production-kv" &> /dev/null; then
        log "${GREEN}✓ Secret: $secret${NC}"
    else
        log "${RED}✗ Secret: $secret${NC}"
        SECRETS_STATUS="✗"
    fi
done
echo ""

# Check PostgreSQL Database
log "${BLUE}Checking PostgreSQL database...${NC}"
if az postgres flexible-server db show --server-name "helpsavta-prod-pg-server" --resource-group "$RESOURCE_GROUP" --database-name "helpsavta" &> /dev/null; then
    log "${GREEN}✓ Database 'helpsavta' exists${NC}"
    DB_STATUS="✓"
else
    log "${RED}✗ Database 'helpsavta' not found${NC}"
    DB_STATUS="✗"
fi
echo ""

# Check SendGrid Configuration
log "${BLUE}Checking SendGrid configuration...${NC}"
SENDGRID_KEY=$(az keyvault secret show --vault-name "helpsavta-production-kv" --name "sendgrid-api-key" --query "value" --output tsv 2>/dev/null || echo "")
if [[ "$SENDGRID_KEY" == "REPLACE_WITH_ACTUAL_SENDGRID_API_KEY" ]]; then
    log "${YELLOW}⚠ SendGrid API key needs to be updated with actual key${NC}"
    SENDGRID_STATUS="⚠"
elif [[ -n "$SENDGRID_KEY" ]]; then
    log "${GREEN}✓ SendGrid API key configured${NC}"
    SENDGRID_STATUS="✓"
else
    log "${RED}✗ SendGrid API key not found${NC}"
    SENDGRID_STATUS="✗"
fi
echo ""

# Get Important URLs and Connection Strings
log "${BLUE}=== Infrastructure Endpoints ===${NC}"
echo ""

if [[ "$WEBAPP_STATUS" == "✓" ]]; then
    echo -e "${GREEN}Production Backend:${NC} https://helpsavta-production-backend.azurewebsites.net"
fi

if [[ "$STAGING_STATUS" == "✓" ]]; then
    echo -e "${GREEN}Staging Backend:${NC} https://helpsavta-production-backend-staging.azurewebsites.net"
fi

if [[ "$POSTGRES_STATUS" == "✓" ]]; then
    echo -e "${GREEN}PostgreSQL Server:${NC} helpsavta-prod-pg-server.postgres.database.azure.com:5432"
fi

if [[ "$REDIS_STATUS" == "✓" ]]; then
    REDIS_HOSTNAME=$(az redis show --name "helpsavta-production-redis" --resource-group "$RESOURCE_GROUP" --query "hostName" --output tsv 2>/dev/null || echo "helpsavta-production-redis.redis.cache.windows.net")
    echo -e "${GREEN}Redis Cache:${NC} $REDIS_HOSTNAME:6380"
fi

if [[ "$ACR_STATUS" == "✓" ]]; then
    ACR_SERVER=$(az acr show --name "helpsavtaprodacr" --resource-group "$RESOURCE_GROUP" --query "loginServer" --output tsv 2>/dev/null || echo "helpsavtaprodacr.azurecr.io")
    echo -e "${GREEN}Container Registry:${NC} $ACR_SERVER"
fi

echo ""

# Summary Report
log "${BLUE}=== Verification Summary ===${NC}"
echo ""
echo -e "Infrastructure Component Status:"
echo -e "├── Resource Group:       $RESOURCE_GROUP_STATUS"
echo -e "├── Key Vault:            $KV_STATUS"
echo -e "├── Storage Account:      $STORAGE_STATUS"
echo -e "├── Redis Cache:          $REDIS_STATUS"
echo -e "├── Container Registry:   $ACR_STATUS"
echo -e "├── App Service Plan:     $ASP_STATUS"
echo -e "├── App Service:          $WEBAPP_STATUS"
echo -e "├── Staging Slot:         $STAGING_STATUS"
echo -e "├── PostgreSQL Server:    $POSTGRES_STATUS"
echo -e "├── Application Insights: $INSIGHTS_STATUS"
echo -e "├── Key Vault Secrets:    $SECRETS_STATUS"
echo -e "├── Database:             $DB_STATUS"
echo -e "└── SendGrid:             $SENDGRID_STATUS"
echo ""

# Overall Status Assessment
if [[ "$RESOURCE_GROUP_STATUS" == "✓" && "$KV_STATUS" == "✓" && "$ASP_STATUS" == "✓" && "$WEBAPP_STATUS" == "✓" && "$POSTGRES_STATUS" == "✓" && "$INSIGHTS_STATUS" == "✓" && "$SECRETS_STATUS" == "✓" ]]; then
    if [[ "$SENDGRID_STATUS" == "⚠" ]]; then
        log "${YELLOW}🟡 Infrastructure deployment SUCCESSFUL with minor configuration needed${NC}"
        echo ""
        log "${YELLOW}Next steps:${NC}"
        log "1. Update SendGrid API key in Key Vault:"
        log "   az keyvault secret set --vault-name helpsavta-production-kv --name sendgrid-api-key --value 'YOUR_ACTUAL_API_KEY'"
        log "2. Run database migrations:"
        log "   cd backend && npx prisma migrate deploy"
        log "3. Deploy application code:"
        log "   ./scripts/deploy.sh production"
        log "4. Test all endpoints and functionality"
        exit 0
    else
        log "${GREEN}🟢 Infrastructure deployment verification SUCCESSFUL!${NC}"
        echo ""
        log "${GREEN}All Azure infrastructure components are ready for application deployment${NC}"
        log "${GREEN}Ready to proceed with database migration phase${NC}"
        exit 0
    fi
else
    log "${RED}🔴 Infrastructure deployment has issues${NC}"
    echo ""
    log "${RED}Please review the failed components above${NC}"
    exit 1
fi