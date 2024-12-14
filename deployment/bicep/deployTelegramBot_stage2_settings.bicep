@description('Azure region for the Function App')
param location string = 'newzealandnorth'

@description('Unique Function App name (3-24 chars)')
@minLength(3)
@maxLength(24)
param functionAppName string

// Reference existing Key Vault (already configured)
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: '${functionAppName}-kv'
}

// Reference existing Function App (already deployed)
resource functionApp 'Microsoft.Web/sites@2022-09-01' existing = {
  name: functionAppName
}

// Update Function App App Settings to Include BOT-TOKEN
resource functionAppUpdate 'Microsoft.Web/sites@2022-09-01' = {
  name: functionApp.name
  properties: {
    siteConfig: {
      appSettings: [
        {
          name: 'BOT_TOKEN'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/BOT-TOKEN)'
        }
        {
          name:'FUNCTIONS_WORKER_RUNTIME'
          value:'node'
        }
        {
          name:'FUNCTIONS_EXTENSION_VERSION'
          value:'~4'
        }
        {
          name:'NODE_ENV'
          value:'production'
        }
        {
          name:'WEBSITE_NODE_DEFAULT_VERSION'
          value:'~20'
        }
      ]
    }
  }
  location:location
}
