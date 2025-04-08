🚀 Project Plan and Progress

📌 Goal:

Build and deploy a containerized QR code web application using DevOps best practices:

FastAPI backend + Next.js frontend

Azure services (Key Vault, Blob Storage, ACR, AKS)

Automated CI/CD via GitHub Actions

Infrastructure as Code using Bicep (and Terraform later)

✅ What was Done:

Set up FastAPI backend and Next.js frontend

Integrated Azure Key Vault for secrets

Improved QR image flow (base64 and upload)

Containerized both frontend and backend

Set up Docker Compose for local dev

Created Bicep template for Azure Container Registry

Cleaned up GitHub repo structure (promoted devops-qr-code content to root)

Configured GitHub Actions to:

Build frontend/backend Docker images

Push to Azure Container Registry (ACR)

Provisioned AKS cluster using Terraform

Deployed frontend and backend services to AKS with Kubernetes YAML files

Connected AKS workloads to Azure Key Vault using Managed Identity

Configured internal routing using Next.js API routes and Kubernetes service discovery

Confirmed full app working on public LoadBalancer: QR code generation, instant preview, and blob upload

