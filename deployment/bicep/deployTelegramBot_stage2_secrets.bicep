@description('Azure region for all resources')
param location string = 'newzealandnorth'

@description('Unique Function App name (3-24 chars)')
@minLength(3)
@maxLength(24)
param functionAppName string

@description('Secure bot token value')
@secure()
param botToken string

// Reference the existing Key Vault deployed in Stage 1
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: '${functionAppName}-kv'
}

// Add the BOT-TOKEN to the Key Vault as a new secret
resource keyVaultSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'BOT-TOKEN'
  properties: {
    value: botToken
  }
}
