@description('Name of the Storage Account')
param storageAccountName string = 'tokacapstonestorage'

@description('Location for all resources.')
param location string = resourceGroup().location

@description('Name of the Blob container to store QR data')
param containerName string = 'qrdata'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/${containerName}'
  properties: {
    publicAccess: 'None' 
  }
}

output containerUri string = 'https://${storageAccount.name}.blob.core.windows.net/${containerName}'
