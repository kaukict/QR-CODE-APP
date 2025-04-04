🚀 Project Plan and Progress

📌 Goal:

Build and deploy a containerized QR code web application using DevOps best practices:

FastAPI backend + Next.js frontend

Azure services (Key Vault, Blob Storage, ACR, AKS)

Automated CI/CD via GitHub Actions

Infrastructure as Code using Bicep (and Terraform later)

✅ What We've Done:

Set up FastAPI backend and Next.js frontend

Integrated Azure Key Vault for secrets

Improved QR image flow (base64 and upload)

Containerized both frontend and backend

Set up Docker Compose for local dev

Created Bicep template for Azure Container Registry

Cleaned up GitHub repo structure (promoted devops-qr-code content to root)

🔜 What's Next:

Configure GitHub Actions to:

Build frontend/backend Docker images

Push to Azure Container Registry (ACR)

Use Terraform to provision an AKS (Azure Kubernetes Service) cluster

Deploy the app to AKS using kubectl

Add CI deployment step (optional Helm later)

