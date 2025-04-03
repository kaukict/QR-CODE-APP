param acrName string = 'ToKaCapstoneContainerReg' // must be globally unique
param location string = resourceGroup().location
param sku string = 'Basic' // Basic, Standard, Premium

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: true
  }
}

output acrLoginServer string = containerRegistry.properties.loginServer
