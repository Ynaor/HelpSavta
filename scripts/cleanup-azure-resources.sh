#!/bin/bash

# Azure Resource Cleanup Script for HelpSavta Simplified Architecture
# This script removes unnecessary Azure resources according to SIMPLIFIED_ARCHITECTURE_DESIGN.md

set -e

RESOURCE_GROUP="helpsavta-prod-rg"

echo "🧹 Starting Azure resource cleanup for simplified architecture..."
echo "Resource Group: $RESOURCE_GROUP"

# Function to check if resource exists
resource_exists() {
    az resource show --resource-group "$RESOURCE_GROUP" --name "$1" --resource-type "$2" >/dev/null 2>&1
}

# Function to delete resource safely
delete_resource() {
    local name=$1
    local type=$2
    local description=$3
    
    if resource_exists "$name" "$type"; then
        echo "🗑️  Deleting $description: $name"
        az resource delete --resource-group "$RESOURCE_GROUP" --name "$name" --resource-type "$type"
        echo "✅ Deleted $description: $name"
    else
        echo "ℹ️  $description not found or already deleted: $name"
    fi
}

echo ""
echo "📋 Resources to be removed (according to simplified architecture):"
echo "❌ App Service Plan (expensive P1v3/PremiumV3)"
echo "❌ App Service + Staging Slot (complex container deployment)"
echo "❌ Container Registry (not needed for Container Apps)"
echo "❌ Redis Cache (not needed for simple application)"
echo "❌ Application Insights (overkill for basic metrics)"
echo "❌ Storage Account (Static Web Apps handles frontend)"
echo ""
echo "✅ Resources to be kept:"
echo "✅ Key Vault (for secrets)"
echo "✅ PostgreSQL Flexible Server (database)"
echo ""

read -p "Do you want to proceed with cleanup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled by user"
    exit 1
fi

echo "🚀 Starting resource deletion..."

# Delete App Service (includes staging slot automatically)
delete_resource "helpsavta-production-backend" "Microsoft.Web/sites" "App Service"

# Delete App Service Plan
delete_resource "helpsavta-production-plan" "Microsoft.Web/serverFarms" "App Service Plan"

# Delete Container Registry
delete_resource "helpsavtaprodacr" "Microsoft.ContainerRegistry/registries" "Container Registry"

# Delete Redis Cache
delete_resource "helpsavta-production-redis" "Microsoft.Cache/Redis" "Redis Cache"

# Delete Application Insights
delete_resource "helpsavta-production-insights" "Microsoft.Insights/components" "Application Insights"

# Delete Storage Account
delete_resource "helpsavtaprodst" "Microsoft.Storage/storageAccounts" "Storage Account"

echo ""
echo "🧹 Cleanup completed!"
echo ""
echo "📊 Cost savings estimate:"
echo "  Before: ~$242/month"
echo "  After:  ~$26/month"
echo "  Savings: ~$216/month (90% reduction)"
echo ""
echo "✅ Remaining resources (to be used by simplified architecture):"
echo "  - Key Vault: helpsavta-production-kv"
echo "  - PostgreSQL: helpsavta-prod-pg-server"
echo ""
echo "🚀 Next steps:"
echo "  1. Deploy simplified infrastructure using: az deployment group create --resource-group $RESOURCE_GROUP --template-file azure/simplified-main.bicep --parameters @azure/simplified-parameters.json"
echo "  2. Update GitHub secrets for new Static Web Apps and Container Apps"
echo "  3. Test the new simplified CI/CD pipeline"