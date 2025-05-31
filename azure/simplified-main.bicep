@description('Environment name (production)')
param environment string = 'production'

@description('Location for all resources')
param location string = resourceGroup().location

@description('PostgreSQL server admin username')
param postgresAdminUsername string

@description('PostgreSQL server admin password')
@secure()
param postgresAdminPassword string

@description('GitHub repository URL')
param githubRepoUrl string = 'https://github.com/your-org/HelpSavta'

@description('GitHub branch for deployment')
param githubBranch string = 'main'

var appName = 'helpsavta-${environment}'

// 1. Reference existing Key Vault (DO NOT CREATE - already exists)
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'helpsavta-production-kv'
}

// 2. Reference existing PostgreSQL server (DO NOT CREATE - already exists in North Europe)
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' existing = {
  name: 'helpsavta-prod-pg-server'
}

// 3. Reference existing Container Apps Environment (DO NOT CREATE - already exists)
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: 'helpsavta-production-env'
}

// Reference existing Log Analytics Workspace (DO NOT CREATE - already exists)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: 'helpsavta-production-logs'
}

// 4. Backend Container App
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'helpsavta-production-backend'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: [
        {
          name: 'database-url'
          value: 'postgresql://${postgresAdminUsername}:${postgresAdminPassword}@helpsavta-prod-pg-server.postgres.database.azure.com:5432/helpsavta?sslmode=require&connect_timeout=60&application_name=helpsavta-backend'
        }
        {
          name: 'sendgrid-api-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/sendgrid-api-key'
          identity: 'system'
        }
        {
          name: 'session-secret'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/session-secret'
          identity: 'system'
        }
        {
          name: 'admin-username'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/admin-username'
          identity: 'system'
        }
        {
          name: 'admin-password'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/admin-password'
          identity: 'system'
        }
        {
          name: 'email-from'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/email-from'
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'helpsavta-backend'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'  // Placeholder - will be updated by CI/CD
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: environment
            }
            {
              name: 'PORT'
              value: '3001'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'SENDGRID_API_KEY'
              secretRef: 'sendgrid-api-key'
            }
            {
              name: 'SESSION_SECRET'
              secretRef: 'session-secret'
            }
            {
              name: 'DEFAULT_ADMIN_USERNAME'
              secretRef: 'admin-username'
            }
            {
              name: 'DEFAULT_ADMIN_PASSWORD'
              secretRef: 'admin-password'
            }
            {
              name: 'EMAIL_FROM'
              secretRef: 'email-from'
            }
            {
              name: 'EMAIL_FROM_NAME'
              value: 'Help Savta'
            }
            {
              name: 'EMAIL_REPLY_TO'
              value: 'support@helpsavta.com'
            }
            {
              name: 'SUPPORT_EMAIL'
              value: 'support@helpsavta.com'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0  // Scale to zero when not in use
        maxReplicas: 3
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// 5. Reference existing Static Web App (DO NOT CREATE - already exists)
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' existing = {
  name: 'helpsavta-production-frontend'
}

// Key Vault Access Policy for Container App
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: backendApp.identity.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
  }
}

// Output values
output backendAppName string = 'helpsavta-production-backend'
output backendAppUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output postgresServerName string = postgresServer.name
output postgresDatabaseName string = 'helpsavta'  // Database name is known
output keyVaultName string = keyVault.name
output containerAppsEnvironmentName string = containerAppsEnv.name
output logAnalyticsWorkspaceName string = logAnalytics.name

// Deployment API token for Static Web Apps (needed for CI/CD)
output staticWebAppsApiToken string = staticWebApp.listSecrets().properties.apiKey
