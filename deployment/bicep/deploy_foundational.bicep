@description('Azure region for all resources (e.g., Function App, Key Vault)')
param location string = 'newzealandnorth'

@description('Azure region for Application Insights')
param appInsightsLocation string = 'australiasoutheast'

@description('Unique Function App name (3-24 chars)')
@minLength(3)
@maxLength(24)
param functionAppName string

@description('Webhook URL for Telegram Bot (optional)')
param webhookUrl string = ''

// Ensure storage account names comply with length limits (3-24 chars)
var storageAccountName = length(functionAppName) <= 22
  ? toLower('${functionAppName}sa')
  : toLower('${substring('${functionAppName}', 0, 22)}sa')

// Storage Account for Function App
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

// App Service Plan for the Function App
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
}

// Application Insights for Monitoring and Diagnostics
resource appInsights 'Microsoft.Insights/components@2020-02-02-preview' = {
  name: '${functionAppName}-ai'
  location: appInsightsLocation
  properties: {
    Application_Type: 'web'
  }
  kind:'web'
}

// Deploy Function App without Key Vault Access (yet)
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned' // Enable Managed Identity
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: storageAccount.properties.primaryEndpoints.blob
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'WEBHOOK_URL'
          value: webhookUrl
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY	'
          value: appInsights.properties.InstrumentationKey
        }
      ]
    }
  }
}

// Deploy the Key Vault (no access policies yet)
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${functionAppName}-kv'
  location: location
  properties: {
    sku: {
      name: 'standard'
      family: 'A'
    }
    tenantId: subscription().tenantId
    accessPolicies:[]
  }
}

// Outputs for Deployment Check
output functionAppHostName string = functionApp.properties.defaultHostName
output keyVaultName string = keyVault.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
