terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  required_version = ">= 1.3.0"
}

provider "azurerm" {
  features {}
}

data "azurerm_resource_group" "capstoneproject" {
  name = var.resource_group_name
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.cluster_name
  location            = data.azurerm_resource_group.capstoneproject.location
  resource_group_name = data.azurerm_resource_group.capstoneproject.name
  #DNS name prefix for public facig AKS API server
  dns_prefix          = "${var.cluster_name}-dns"

  #sku
  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_DS2_v2"
  }

  #create Managed Itentity so AKS cluster can access other azure resources like AKR
  identity {
    type = "SystemAssigned"
  }
  #tags to manage the resources 
  tags = {
    environment = "dev"
    project     = "capstone"
  }
}
#Granting AKS permission to pull images from AKR by assingning "AcrPull" permission to managed itentity created in previous step
data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.capstoneproject.name
}

resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id         = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name = "AcrPull"
  scope                = data.azurerm_container_registry.acr.id
}
