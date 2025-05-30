#!/bin/bash

# Azure Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}Error: Environment must be 'staging' or 'production'${NC}"
    exit 1
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "production" ]]; then
    RESOURCE_GROUP="helpsavta-prod-rg"
else
    RESOURCE_GROUP="helpsavta-${ENVIRONMENT}-rg"
fi

KEY_VAULT_NAME="helpsavta-${ENVIRONMENT}-kv"
WEBAPP_NAME="helpsavta-${ENVIRONMENT}-backend"

echo -e "${BLUE}=== Azure Deployment Verification ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Resource Group: ${YELLOW}${RESOURCE_GROUP}${NC}"
echo -e "Subscription: ${YELLOW}${SUBSCRIPTION_ID}${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check resource existence
check_resource() {
    local resource_type=$1
    local resource_name=$2
    local resource_group=$3
    
    if az $resource_type show --name "$resource_name" --resource-group "$resource_group" &> /dev/null; then
        log "${GREEN}✓ $resource_type: $resource_name${NC}"
        return 0
    else
        log "${RED}✗ $resource_type: $resource_name${NC}"
        return 1
    fi
}

# Function to check Key Vault secret
check_secret() {
    local secret_name=$1
    local vault_name=$2
    
    if az keyvault secret show --name "$secret_name" --vault-name "$vault_name" &> /dev/null; then
        log "${GREEN}✓ Secret: $secret_name${NC}"
        return 0
    else
        log "${RED}✗ Secret: $secret_name${NC}"
        return 1
    fi
}

# Check prerequisites
log "${BLUE}Checking prerequisites...${NC}"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    log "${RED}Azure CLI is not installed${NC}"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log "${RED}Not logged in to Azure. Please run 'az login' first${NC}"
    exit 1
fi

# Check if subscription is set
if [[ -z "$SUBSCRIPTION_ID" ]]; then
    log "${RED}AZURE_SUBSCRIPTION_ID environment variable is not set${NC}"
    exit 1
fi

# Set Azure subscription
log "${BLUE}Setting Azure subscription...${NC}"
az account set --subscription "$SUBSCRIPTION_ID"

log "${GREEN}✓ Prerequisites satisfied${NC}"
echo ""

# Check Resource Group
log "${BLUE}Checking resource group...${NC}"
if check_resource "group" "$RESOURCE_GROUP" ""; then
    RESOURCE_GROUP_STATUS="✓"
else
    RESOURCE_GROUP_STATUS="✗"
fi
echo ""

# Check Core Resources
log "${BLUE}Checking core resources...${NC}"
CORE_RESOURCES=(
    "appservice plan:helpsavta-${ENVIRONMENT}-plan"
    "webapp:helpsavta-${ENVIRONMENT}-backend"
    "postgres flexible-server:helpsavta-${ENVIRONMENT}-postgres"
    "redis:helpsavta-${ENVIRONMENT}-redis"
    "keyvault:helpsavta-${ENVIRONMENT}-kv"
    "monitor app-insights:helpsavta-${ENVIRONMENT}-insights"
    "acr:helpsavta${ENVIRONMENT}acr"
    "storage account:helpsavta${ENVIRONMENT}storage"
)

CORE_STATUS="✓"
for resource in "${CORE_RESOURCES[@]}"; do
    IFS=':' read -r type name <<< "$resource"
    if ! check_resource "$type" "$name" "$RESOURCE_GROUP"; then
        CORE_STATUS="✗"
    fi
done
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
)

SECRETS_STATUS="✓"
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! check_secret "$secret" "$KEY_VAULT_NAME"; then
        SECRETS_STATUS="✗"
    fi
done
echo ""

# Check Web App Configuration
log "${BLUE}Checking web app configuration...${NC}"
if az webapp show --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    # Check if app settings are configured
    APP_SETTINGS=$(az webapp config appsettings list --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" --query "length(@)" --output tsv)
    if [[ "$APP_SETTINGS" -gt 5 ]]; then
        log "${GREEN}✓ Web app configuration: $APP_SETTINGS settings configured${NC}"
        WEBAPP_CONFIG_STATUS="✓"
    else
        log "${YELLOW}⚠ Web app configuration: Only $APP_SETTINGS settings found${NC}"
        WEBAPP_CONFIG_STATUS="⚠"
    fi
    
    # Check if staging slot exists
    if az webapp deployment slot show --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" --slot "staging" &> /dev/null; then
        log "${GREEN}✓ Staging deployment slot exists${NC}"
        STAGING_STATUS="✓"
    else
        log "${RED}✗ Staging deployment slot missing${NC}"
        STAGING_STATUS="✗"
    fi
else
    WEBAPP_CONFIG_STATUS="✗"
    STAGING_STATUS="✗"
fi
echo ""

# Check Database Configuration
log "${BLUE}Checking database configuration...${NC}"
POSTGRES_SERVER="helpsavta-${ENVIRONMENT}-postgres"
if az postgres flexible-server db show --server-name "$POSTGRES_SERVER" --resource-group "$RESOURCE_GROUP" --database-name "helpsavta" &> /dev/null; then
    log "${GREEN}✓ Database 'helpsavta' exists${NC}"
    DB_STATUS="✓"
else
    log "${RED}✗ Database 'helpsavta' not found${NC}"
    DB_STATUS="✗"
fi
echo ""

# Check Monitoring Configuration
log "${BLUE}Checking monitoring configuration...${NC}"
INSIGHTS_NAME="helpsavta-${ENVIRONMENT}-insights"
if az monitor app-insights component show --app "$INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log "${GREEN}✓ Application Insights configured${NC}"
    
    # Check if alerts are configured
    ALERT_COUNT=$(az monitor metrics alert list --resource-group "$RESOURCE_GROUP" --query "length(@)" --output tsv)
    if [[ "$ALERT_COUNT" -gt 0 ]]; then
        log "${GREEN}✓ Monitoring alerts: $ALERT_COUNT alerts configured${NC}"
        MONITORING_STATUS="✓"
    else
        log "${YELLOW}⚠ Monitoring alerts: No alerts configured${NC}"
        MONITORING_STATUS="⚠"
    fi
else
    log "${RED}✗ Application Insights not found${NC}"
    MONITORING_STATUS="✗"
fi
echo ""

# Check SendGrid Configuration
log "${BLUE}Checking SendGrid configuration...${NC}"
SENDGRID_KEY=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "sendgrid-api-key" --query "value" --output tsv 2>/dev/null || echo "")
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

# Summary Report
log "${BLUE}=== Verification Summary ===${NC}"
echo ""
echo -e "Component Status Report:"
echo -e "├── Resource Group:      $RESOURCE_GROUP_STATUS"
echo -e "├── Core Resources:      $CORE_STATUS"
echo -e "├── Key Vault Secrets:   $SECRETS_STATUS"
echo -e "├── Web App Config:      $WEBAPP_CONFIG_STATUS"
echo -e "├── Staging Slot:        $STAGING_STATUS"
echo -e "├── Database:            $DB_STATUS"
echo -e "├── Monitoring:          $MONITORING_STATUS"
echo -e "└── SendGrid:            $SENDGRID_STATUS"
echo ""

# Overall Status
if [[ "$RESOURCE_GROUP_STATUS" == "✓" && "$CORE_STATUS" == "✓" && "$SECRETS_STATUS" == "✓" && "$DB_STATUS" == "✓" ]]; then
    if [[ "$SENDGRID_STATUS" == "⚠" ]]; then
        log "${YELLOW}🟡 Deployment mostly complete - SendGrid API key needs updating${NC}"
        echo ""
        log "${YELLOW}Next steps:${NC}"
        log "1. Update SendGrid API key in Key Vault:"
        log "   az keyvault secret set --vault-name $KEY_VAULT_NAME --name sendgrid-api-key --value 'YOUR_ACTUAL_API_KEY'"
        log "2. Test email functionality"
        log "3. Proceed with database migration"
        exit 0
    else
        log "${GREEN}🟢 Deployment verification successful!${NC}"
        echo ""
        log "${GREEN}Infrastructure is ready for database migration and application deployment${NC}"
        exit 0
    fi
else
    log "${RED}🔴 Deployment verification failed${NC}"
    echo ""
    log "${RED}Please review the failed components and re-run the deployment${NC}"
    exit 1
fi