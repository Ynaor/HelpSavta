@description('Environment name (staging or production)')
param environment string

@description('Location for all resources')
param location string = resourceGroup().location

@description('App Service Plan SKU')
param appServicePlanSku string = 'P1v3'

@description('PostgreSQL server admin username')
param postgresAdminUsername string

@description('PostgreSQL server admin password')
@secure()
param postgresAdminPassword string

@description('Redis Cache SKU')
param redisCacheSku object = {
  name: 'Standard'
  family: 'C'
  capacity: 1
}

var appName = 'helpsavta-${environment}'
var appServicePlanName = '${appName}-plan'
var postgresServerName = '${appName}-postgres'
var redisCacheName = '${appName}-redis'
var keyVaultName = '${appName}-kv'
var applicationInsightsName = '${appName}-insights'
var containerRegistryName = 'helpsavta${environment}acr'
var cdnProfileName = '${appName}-cdn'
var storageAccountName = 'helpsavta${environment}storage'

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServicePlanSku
    tier: 'PremiumV3'
    size: appServicePlanSku
    family: 'Pv3'
    capacity: 1
  }
  properties: {
    reserved: true
  }
  kind: 'linux'
}

// Storage Account for static assets
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: postgresAdminUsername
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    version: '15'
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// PostgreSQL Database
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: 'helpsavta'
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// PostgreSQL Firewall Rule - Allow Azure Services
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Redis Cache
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  location: location
  properties: {
    sku: redisCacheSku
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    enableRbacAuthorization: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
  }
}

// CDN Profile
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: 'Global'
  sku: {
    name: 'Standard_Microsoft'
  }
  properties: {}
}

// CDN Endpoint
resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: '${appName}-cdn-endpoint'
  location: 'Global'
  properties: {
    originHostHeader: '${storageAccountName}.blob.core.windows.net'
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    origins: [
      {
        name: 'storage-origin'
        properties: {
          hostName: '${storageAccountName}.blob.core.windows.net'
          httpsPort: 443
          originHostHeader: '${storageAccountName}.blob.core.windows.net'
        }
      }
    ]
    deliveryPolicy: {
      rules: [
        {
          name: 'CacheStaticAssets'
          order: 1
          conditions: [
            {
              name: 'UrlFileExtension'
              parameters: {
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlFileExtensionMatchConditionParameters'
                operator: 'Equal'
                matchValues: [
                  'css'
                  'js'
                  'png'
                  'jpg'
                  'jpeg'
                  'gif'
                  'svg'
                  'ico'
                  'woff'
                  'woff2'
                  'ttf'
                  'eot'
                ]
                transforms: [
                  'Lowercase'
                ]
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleCacheExpirationActionParameters'
                cacheBehavior: 'Override'
                cacheType: 'All'
                cacheDuration: '30.00:00:00'
              }
            }
          ]
        }
      ]
    }
  }
}

// Backend Web App
resource backendWebApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${appName}-backend'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerRegistry.properties.loginServer}/helpsavta-backend:latest'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${containerRegistry.properties.loginServer}'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_USERNAME'
          value: containerRegistry.name
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
          value: containerRegistry.listCredentials().passwords[0].value
        }
        {
          name: 'NODE_ENV'
          value: environment
        }
        {
          name: 'DATABASE_URL'
          value: 'postgresql://${postgresAdminUsername}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/helpsavta?sslmode=require'
        }
        {
          name: 'REDIS_URL'
          value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:${redisCache.properties.sslPort}'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'KEY_VAULT_URL'
          value: keyVault.properties.vaultUri
        }
        {
          name: 'SENDGRID_API_KEY'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/sendgrid-api-key/)'
        }
        {
          name: 'EMAIL_FROM'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/email-from/)'
        }
        {
          name: 'EMAIL_HOST'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/email-host/)'
        }
        {
          name: 'EMAIL_PORT'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/email-port/)'
        }
        {
          name: 'EMAIL_USER'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/email-user/)'
        }
        {
          name: 'EMAIL_PASS'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/sendgrid-api-key/)'
        }
        {
          name: 'SESSION_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/session-secret/)'
        }
        {
          name: 'DEFAULT_ADMIN_USERNAME'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/admin-username/)'
        }
        {
          name: 'DEFAULT_ADMIN_PASSWORD'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/admin-password/)'
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
        {
          name: 'EMAIL_SECURE'
          value: 'true'
        }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'postgresql://${postgresAdminUsername}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/helpsavta?sslmode=require'
          type: 'PostgreSQL'
        }
      ]
    }
  }
}

// Backend Web App Staging Slot
resource backendStagingSlot 'Microsoft.Web/sites/slots@2022-09-01' = {
  parent: backendWebApp
  name: 'staging'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerRegistry.properties.loginServer}/helpsavta-backend:latest'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${containerRegistry.properties.loginServer}'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_USERNAME'
          value: containerRegistry.name
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
          value: containerRegistry.listCredentials().passwords[0].value
        }
        {
          name: 'NODE_ENV'
          value: '${environment}-staging'
        }
        {
          name: 'DATABASE_URL'
          value: 'postgresql://${postgresAdminUsername}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/helpsavta?sslmode=require'
        }
        {
          name: 'REDIS_URL'
          value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:${redisCache.properties.sslPort}'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
      ]
    }
  }
}

// Key Vault Access Policy for Backend Web App
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: backendWebApp.identity.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: backendStagingSlot.identity.principalId
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
output webAppName string = backendWebApp.name
output webAppUrl string = 'https://${backendWebApp.properties.defaultHostName}'
output stagingSlotUrl string = 'https://${backendStagingSlot.properties.defaultHostName}'
output postgresServerName string = postgresServer.name
output postgresDatabaseName string = postgresDatabase.name
output redisCacheName string = redisCache.name
output keyVaultName string = keyVault.name
output applicationInsightsName string = applicationInsights.name
output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output cdnEndpointUrl string = 'https://${cdnEndpoint.properties.hostName}'
output storageAccountName string = storageAccount.name
