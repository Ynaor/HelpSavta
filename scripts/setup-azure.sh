#!/bin/bash

# Azure Infrastructure Setup Script
# Usage: ./scripts/setup-azure.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
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
KEY_VAULT_NAME="helpsavta-${ENVIRONMENT}-kv"
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID}"

echo -e "${BLUE}=== Azure Infrastructure Setup ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Resource Group: ${YELLOW}${RESOURCE_GROUP}${NC}"
echo -e "Location: ${YELLOW}${LOCATION}${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
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

log "${GREEN}✓ All prerequisites satisfied${NC}"
echo ""

# Set Azure subscription
log "${BLUE}Setting Azure subscription...${NC}"
az account set --subscription "$SUBSCRIPTION_ID"

# Get current user info for Key Vault permissions
CURRENT_USER_ID=$(az ad signed-in-user show --query id --output tsv)
log "Current user ID: $CURRENT_USER_ID"

# Create resource group
log "${BLUE}Creating resource group...${NC}"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

# Create Key Vault first (for secrets)
log "${BLUE}Creating Key Vault...${NC}"
az keyvault create \
    --name "$KEY_VAULT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --enable-rbac-authorization false \
    --output table

# Set Key Vault access policy for current user
log "${BLUE}Setting Key Vault access policy...${NC}"
az keyvault set-policy \
    --name "$KEY_VAULT_NAME" \
    --object-id "$CURRENT_USER_ID" \
    --secret-permissions get list set delete \
    --output table

# Generate and store secrets
log "${BLUE}Generating and storing secrets...${NC}"

# Generate PostgreSQL admin password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "postgres-admin-password" \
    --value "$POSTGRES_PASSWORD" \
    --output table

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "jwt-secret" \
    --value "$JWT_SECRET" \
    --output table

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "session-secret" \
    --value "$SESSION_SECRET" \
    --output table

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "encryption-key" \
    --value "$ENCRYPTION_KEY" \
    --output table

# Store email configuration (if provided)
if [[ -n "$SMTP_HOST" ]]; then
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "smtp-host" \
        --value "$SMTP_HOST" \
        --output table
fi

if [[ -n "$SMTP_USER" ]]; then
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "smtp-user" \
        --value "$SMTP_USER" \
        --output table
fi

if [[ -n "$SMTP_PASSWORD" ]]; then
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "smtp-password" \
        --value "$SMTP_PASSWORD" \
        --output table
fi

# Update parameters file with Key Vault reference
log "${BLUE}Updating parameters file...${NC}"
PARAMS_FILE="$PROJECT_ROOT/azure/parameters.$ENVIRONMENT.json"
KEY_VAULT_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME"

# Create temporary parameters file with correct Key Vault ID
cat > "${PARAMS_FILE}.tmp" << EOF
{
  "\$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "$ENVIRONMENT"
    },
    "location": {
      "value": "$LOCATION"
    },
    "appServicePlanSku": {
      "value": "$([ "$ENVIRONMENT" = "production" ] && echo "P1v3" || echo "B1")"
    },
    "postgresAdminUsername": {
      "value": "helpsavta_admin"
    },
    "postgresAdminPassword": {
      "reference": {
        "keyVault": {
          "id": "$KEY_VAULT_ID"
        },
        "secretName": "postgres-admin-password"
      }
    },
    "redisCacheSku": {
      "value": {
        "name": "$([ "$ENVIRONMENT" = "production" ] && echo "Standard" || echo "Basic")",
        "family": "C",
        "capacity": $([ "$ENVIRONMENT" = "production" ] && echo "1" || echo "0")
      }
    }
  }
}
EOF

mv "${PARAMS_FILE}.tmp" "$PARAMS_FILE"

# Deploy infrastructure
log "${BLUE}Deploying infrastructure with Bicep...${NC}"
DEPLOYMENT_NAME="helpsavta-infrastructure-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$PROJECT_ROOT/azure/main.bicep" \
    --parameters "@$PARAMS_FILE" \
    --name "$DEPLOYMENT_NAME" \
    --output table

# Get deployment outputs
log "${BLUE}Retrieving deployment outputs...${NC}"

WEBAPP_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.webAppName.value' \
    --output tsv)

CONTAINER_REGISTRY=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.containerRegistryLoginServer.value' \
    --output tsv)

POSTGRES_SERVER=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.postgresServerName.value' \
    --output tsv)

CDN_ENDPOINT=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.cdnEndpointUrl.value' \
    --output tsv)

# Store additional configuration in Key Vault
log "${BLUE}Storing additional configuration...${NC}"

az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "database-url" \
    --value "postgresql://helpsavta_admin:$POSTGRES_PASSWORD@$POSTGRES_SERVER.postgres.database.azure.com:5432/helpsavta?sslmode=require" \
    --output table

az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "webapp-name" \
    --value "$WEBAPP_NAME" \
    --output table

az keyvault secret set \
    --vault-name "$KEY_VAULT_NAME" \
    --name "container-registry" \
    --value "$CONTAINER_REGISTRY" \
    --output table

# Configure custom domain (if provided)
if [[ -n "$CUSTOM_DOMAIN" ]]; then
    log "${BLUE}Configuring custom domain...${NC}"
    
    # Add custom domain to web app
    az webapp config hostname add \
        --resource-group "$RESOURCE_GROUP" \
        --webapp-name "$WEBAPP_NAME" \
        --hostname "$CUSTOM_DOMAIN"
    
    # Enable HTTPS (requires domain verification)
    az webapp config ssl bind \
        --resource-group "$RESOURCE_GROUP" \
        --name "$WEBAPP_NAME" \
        --certificate-thumbprint auto \
        --ssl-type SNI
fi

# Configure monitoring alerts
log "${BLUE}Setting up monitoring alerts...${NC}"

# Get Application Insights resource ID
APP_INSIGHTS_ID=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.applicationInsightsName.value' \
    --output tsv)

# Create action group for notifications
az monitor action-group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "helpsavta-$ENVIRONMENT-alerts" \
    --short-name "HelpSavta" \
    --action email admin "${ADMIN_EMAIL:-admin@helpsavta.com}" \
    --output table

# Create metric alerts
# High CPU usage alert
az monitor metrics alert create \
    --name "High CPU Usage - $ENVIRONMENT" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEBAPP_NAME" \
    --condition "avg Percentage CPU > 80" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "helpsavta-$ENVIRONMENT-alerts" \
    --description "Alert when CPU usage is consistently high" \
    --output table

# High memory usage alert
az monitor metrics alert create \
    --name "High Memory Usage - $ENVIRONMENT" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEBAPP_NAME" \
    --condition "avg MemoryPercentage > 85" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "helpsavta-$ENVIRONMENT-alerts" \
    --description "Alert when memory usage is consistently high" \
    --output table

# HTTP 5xx errors alert
az monitor metrics alert create \
    --name "HTTP Server Errors - $ENVIRONMENT" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEBAPP_NAME" \
    --condition "total Http5xx > 10" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "helpsavta-$ENVIRONMENT-alerts" \
    --description "Alert when there are too many server errors" \
    --output table

log "${GREEN}=== Azure infrastructure setup completed successfully! ===${NC}"
echo ""
log "${BLUE}Setup Summary:${NC}"
log "Environment: $ENVIRONMENT"
log "Resource Group: $RESOURCE_GROUP"
log "Web App: $WEBAPP_NAME"
log "Container Registry: $CONTAINER_REGISTRY"
log "PostgreSQL Server: $POSTGRES_SERVER"
log "Key Vault: $KEY_VAULT_NAME"
log "CDN Endpoint: $CDN_ENDPOINT"
log "Deployment Name: $DEPLOYMENT_NAME"
echo ""
log "${YELLOW}Next steps:${NC}"
log "1. Run database migrations: cd backend && npx prisma migrate deploy"
log "2. Build and deploy application: ./scripts/deploy.sh $ENVIRONMENT"
log "3. Configure custom domain if needed"
log "4. Set up backup policies"
echo ""
log "${BLUE}Important secrets stored in Key Vault:${NC}"
log "- postgres-admin-password"
log "- jwt-secret"
log "- session-secret"
log "- encryption-key"
log "- database-url"