# Azure Deployment Secrets Configuration Guide

This document provides a complete guide for configuring all required GitHub repository secrets needed for the Azure deployment workflow.

## 🔐 Required GitHub Repository Secrets

The following secrets must be configured in your GitHub repository Settings → Secrets and variables → Actions → Repository secrets:

### 1. Azure Authentication
- **`AZURE_CREDENTIALS`** - Azure service principal credentials for GitHub Actions
- **`AZURE_SUBSCRIPTION_ID`** - Azure subscription ID: `6720ecf6-4ad2-4909-b6b6-4696eb862b26`
- **`AZURE_RESOURCE_GROUP`** - Resource group name: `helpsavta-prod-rg`

### 2. Azure Container Registry (ACR)
- **`AZURE_CONTAINER_REGISTRY`** - ACR login server (e.g., `helpsavtaprodacr.azurecr.io`)
- **`AZURE_CONTAINER_REGISTRY_USERNAME`** - ACR username
- **`AZURE_CONTAINER_REGISTRY_PASSWORD`** - ACR password/access key

### 3. Azure Static Web Apps
- **`AZURE_STATIC_WEB_APPS_API_TOKEN`** - Deployment token for Static Web Apps

### 4. Database Configuration
- **`DATABASE_URL_PRODUCTION`** - PostgreSQL connection string for production

### 5. Application Configuration
- **`SENDGRID_API_KEY`** - SendGrid API key for email functionality
- **`SESSION_SECRET`** - Strong session secret (32+ characters)
- **`ADMIN_USERNAME`** - Default admin username
- **`ADMIN_PASSWORD`** - Default admin password (strong password required)
- **`EMAIL_FROM`** - From email address (e.g., `noreply@helpsavta.com`)

## 🔍 How to Find Each Secret in Azure Portal

### Azure Credentials (Service Principal)
1. Navigate to Azure Portal → Azure Active Directory → App registrations
2. Find or create service principal for GitHub Actions
3. Go to Certificates & secrets → Create new client secret
4. Format as JSON:
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "6720ecf6-4ad2-4909-b6b6-4696eb862b26",
  "tenantId": "your-tenant-id"
}
```

### Container Registry Credentials
1. Navigate to Azure Portal → Container registries
2. Find registry (likely named like `helpsavtaprodacr`)
3. Go to Access keys
4. **Login server**: Copy the login server URL
5. **Username**: Copy the username (usually registry name)
6. **Password**: Copy password/password2

### Static Web Apps API Token
1. Navigate to Azure Portal → Static Web Apps
2. Find `helpsavta-production-frontend`
3. Go to Overview → Manage deployment token
4. **CRITICAL**: If token shows as invalid, generate a new one
5. Copy the deployment token

### Database URL
Based on bicep configuration, the format should be:
```
postgresql://helpsavta_admin:PASSWORD@helpsavta-prod-pg-server.postgres.database.azure.com:5432/helpsavta?sslmode=require
```
- Username: `helpsavta_admin` (from parameters file)
- Password: Stored in Azure Key Vault as `postgres-admin-password`
- Server: `helpsavta-prod-pg-server.postgres.database.azure.com`
- Database: `helpsavta`

### Key Vault Secrets
Navigate to Azure Portal → Key vaults → `helpsavta-production-kv` → Secrets:
- `sendgrid-api-key` → Use for `SENDGRID_API_KEY`
- `session-secret` → Use for `SESSION_SECRET`
- `admin-username` → Use for `ADMIN_USERNAME`
- `admin-password` → Use for `ADMIN_PASSWORD`
- `email-from` → Use for `EMAIL_FROM`
- `postgres-admin-password` → Use in `DATABASE_URL_PRODUCTION`

## 🔄 How to Regenerate Expired Tokens

### Static Web Apps Token (Most Common Issue)
**Symptoms**: Error "deployment_token provided was invalid"

**Solution**:
1. Go to Azure Portal → Static Web Apps → `helpsavta-production-frontend`
2. Navigate to Overview section
3. Click "Manage deployment token"
4. Click "Reset token" to generate new token
5. Copy the new token
6. Update `AZURE_STATIC_WEB_APPS_API_TOKEN` secret in GitHub

### Container Registry Access Keys
1. Go to Azure Portal → Container registries → Your ACR
2. Navigate to Access keys
3. Click "Regenerate" next to password or password2
4. Update `AZURE_CONTAINER_REGISTRY_PASSWORD` in GitHub

### Service Principal Client Secret
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Find your service principal
3. Go to Certificates & secrets
4. Create new client secret (old one will expire)
5. Update `AZURE_CREDENTIALS` JSON with new clientSecret

## ✅ Verification Commands

### Test Azure CLI Authentication
```bash
# Test if Azure credentials work
az login --service-principal -u CLIENT_ID -p CLIENT_SECRET --tenant TENANT_ID
az account show
```

### Test Container Registry Access
```bash
# Test ACR login
echo "ACR_PASSWORD" | docker login ACR_LOGIN_SERVER -u ACR_USERNAME --password-stdin
```

### Test Database Connection
```bash
# Test PostgreSQL connection (requires psql client)
psql "postgresql://helpsavta_admin:PASSWORD@helpsavta-prod-pg-server.postgres.database.azure.com:5432/helpsavta?sslmode=require" -c "SELECT version();"
```

### Test Static Web Apps Token
The token validation happens during deployment. Monitor the GitHub Actions workflow for:
- ✅ Success: "Static web app validated"
- ❌ Failure: "deployment_token provided was invalid"

## 🎯 Expected Azure Resources

Based on the bicep configuration, these resources should exist:

| Resource Type | Resource Name | Purpose |
|---------------|---------------|---------|
| Resource Group | `helpsavta-prod-rg` | Container for all resources |
| Key Vault | `helpsavta-production-kv` | Stores secrets |
| PostgreSQL Server | `helpsavta-prod-pg-server` | Database server |
| Container Apps Environment | `helpsavta-production-env` | Backend hosting |
| Static Web App | `helpsavta-production-frontend` | Frontend hosting |
| Log Analytics | `helpsavta-production-logs` | Monitoring |
| Container Registry | `helpsavta*acr` | Docker images |

## 🚨 Security Best Practices

1. **Rotate secrets regularly** (every 90 days recommended)
2. **Use strong passwords** (20+ characters with mixed case, numbers, symbols)
3. **Limit service principal permissions** to minimum required
4. **Monitor Key Vault access logs**
5. **Never commit secrets to version control**

## 🔧 Troubleshooting Common Issues

### "deployment_token provided was invalid"
- **Cause**: Static Web Apps token expired or incorrect
- **Solution**: Regenerate token in Azure Portal

### Container registry login failed
- **Cause**: ACR credentials expired or incorrect
- **Solution**: Check ACR access keys, regenerate if needed

### Database connection failed
- **Cause**: Wrong connection string or database doesn't exist
- **Solution**: Verify PostgreSQL server exists and database is created

### KeyVault access denied
- **Cause**: Container App identity lacks KeyVault permissions
- **Solution**: Bicep template should handle this automatically

## 📝 Deployment Workflow Summary

The GitHub Actions workflow performs these steps:
1. **Build & Test**: Frontend and backend validation
2. **Frontend Deploy**: Upload to Azure Static Web Apps
3. **Backend Deploy**: Build Docker image → Push to ACR → Deploy to Container Apps
4. **Database**: Run Prisma migrations
5. **Health Check**: Verify deployment success

Each step requires specific secrets to be properly configured.