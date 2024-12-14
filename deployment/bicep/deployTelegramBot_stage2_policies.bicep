@description('Object ID of the Function App Managed Identity')
param principalId string

@description('Unique Function App name (3-24 chars)')
@minLength(3)
@maxLength(24)
param functionAppName string

// Reference the existing Key Vault deployed in Stage 1
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: '${functionAppName}-kv'
}

// Add Access Policy for Service Principal
resource keyVaultAccessPolicyServicePrincipal 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        objectId: '2b7499e4-3a19-4534-9e2d-a2edb55d2d71' // Service Principal ObjectId
        tenantId: subscription().tenantId
        permissions: {
          secrets: [
            'get'
            'list' // Ensure the Service Principal can enumerate secrets
            'set'   // Allow secret creation
          ]
        }
      }
      {
        objectId: principalId // Ensure the Azure Function App can read the secure key
        tenantId: subscription().tenantId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
    ]
  }
}
