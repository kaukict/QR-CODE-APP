variable "resource_group_name" {
  type        = string
  description = "The name of the resource group"
}

variable "cluster_name" {
  type        = string
  description = "Name of the AKS cluster"
  default     = "capstone-aks"
}

variable "acr_name" {
  type        = string
  description = "The name of the Azure Container Registry"
}