## DevOps QR Code Project - Step-by-Step Summary

### ✅ 1. **Initial App Setup**
- FastAPI backend to generate QR codes and upload them to Azure Blob Storage
- Next.js frontend for user input and image display
- Secrets (Azure Storage connection string, container name) stored in Azure Key Vault

### ✅ 2. **Key Vault Integration**
- Used `DefaultAzureCredential` from `azure.identity` to authenticate via Azure CLI (locally)
- Accessed secrets using `SecretClient` from `azure.keyvault.secrets`
- Environment variable `AZURE_KEY_VAULT_NAME` used to make Key Vault dynamic and image-portable

### ✅ 3. **Improved QR Code Flow**
- Backend now:
  - Generates QR image in memory
  - Returns it as a base64-encoded image (data URL)
  - Uploads image to Azure Blob Storage in the background
- Frontend:
  - Displays image instantly
  - Includes download button
  - Adds spacing between UI elements for better layout

### ✅ 4. **Containerization**
- Created Dockerfiles for:
  - Backend (`api/Dockerfile`)
  - Frontend (`front-end-nextjs/Dockerfile`)
- Fixed CMD syntax issues (`CMD ["uvicorn", ...]` instead of Python-style parens)
- Ensured frontend runs `npm run build` and doesn’t include `.next/` in `.dockerignore`
- Verified working directories and context alignment

### ✅ 5. **Docker Compose Setup**
- Created single `docker-compose.yml` to spin up both frontend and backend
- Mapped ports: `8000` for backend, `3000` for frontend
- Configured frontend to call backend using internal Docker network (`http://backend:8000`)
- Explicitly set `NEXT_PUBLIC_API_URL=http://backend:8000` in `frontend` environment section to ensure dynamic runtime config
- Frontend now uses `process.env.NEXT_PUBLIC_API_URL` instead of hardcoded `localhost` URL
- Set environment variables using `env_file: .env` for local dev secrets
- Backend falls back to local `.env` file when Key Vault isn’t accessible in container (safe dev fallback)
- Confirmed: 
  - ✅ Frontend is working in container
  - ✅ Backend builds successfully
  - ⚠️ Backend cannot access Azure Key Vault in Docker (expected in local dev)

### ✅ 6. **Bicep Templates and Infrastructure Setup**
- Created a Bicep file (`acr.bicep`) to provision Azure Container Registry (ACR)
- Parameters:
  - `acrName`: globally unique name for the ACR
  - `location`: region to deploy to (defaults to resource group location)
  - `sku`: ACR pricing tier (Basic, Standard, Premium)
- Enabled `adminUser` for simple credential access (useful in GitHub Actions CI/CD)
- Sample deploy command:
  ```bash
  az deployment group create \
    --resource-group <your-rg-name> \
    --template-file acr.bicep \
    --parameters acrName=<youracrname>
  ```
- After deployment, use `az acr credential show` to retrieve push credentials
- Login server output example: `myacr.azurecr.io`
- This ACR will be used for pushing built Docker images during CI/CD

### ✅ 7. GitHub Actions CI/CD Setup

Created GitHub Actions workflow .github/workflows/docker-build-and-push.yml

Workflow runs on every push to the main branch

Steps included:

✅ Checkout source code
✅ Log in to Azure using service principal stored in GitHub Secrets
✅ Authenticate to ACR using az acr login
✅ Build and tag backend and frontend Docker images
✅ Push images to Azure Container Registry

Configured GitHub Secret AZURE_CREDENTIALS using output from:

az ad sp create-for-rbac \
  --name "gh-actions-sp" \
  --role contributor \
  --scopes /subscriptions/<sub-id>/resourceGroups/<rg-name> \
  --sdk-auth

Verified successful GitHub Actions execution and image upload to ACR ✅
 
 ### ✅ 8. Terraform AKS Setup

Added .terraform/ and *.tfstate to .gitignore to avoid committing large provider binaries or sensitive state files

Created a new terraform/ directory to manage infrastructure

Initialized Terraform with Azure provider in main.tf

Used the Azure CLI login context to authenticate Terraform for local development

Instead of creating a new resource group, we referenced an existing one using a data block:

data "azurerm_resource_group" "capstoneproject" {
  name = var.resource_group_name
}

This allows Terraform to read the resource group and its properties (like location) without managing or modifying it

Location is now pulled dynamically using:

location = data.azurerm_resource_group.capstoneproject.location

Removed the need for a separate location variable in variables.tf

Defined the AKS cluster with:

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.cluster_name
  location            = data.azurerm_resource_group.capstoneproject.location
  resource_group_name = data.azurerm_resource_group.capstoneproject.name
  dns_prefix          = "${var.cluster_name}-dns"

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_DS2_v2"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    environment = "dev"
    project     = "capstone"
  }
}

Integrated AKS with ACR to allow secure image pulls:

Used a data block to reference existing ACR

Assigned AcrPull role to the AKS cluster's kubelet identity:

data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.capstoneproject.name
}

resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id         = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name = "AcrPull"
  scope                = data.azurerm_container_registry.acr.id
}

Configured environment variable AZURE_KEY_VAULT_NAME in the backend deployment manifest

Assigned get and list Key Vault permissions to the correct identity actually used by AKS pods (validated via runtime error message)

✅ Confirmed backend is running and able to retrieve secrets from Key Vault using the correct pod-assigned managed identity (determined from Key Vault access error and fixed via updated access policy)

 ### ✅ 9. Frontend Environment Variable Injection (NEXT_PUBLIC_API_URL)$1

Update: Using Internal Rewrites in Next.js

To avoid exposing internal cluster names like backend:8000 to the browser (which causes DNS errors), we implemented a Next.js rewrites() rule:

In next.config.js, added:

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/:path*'
      }
    ]
  }
}

module.exports = nextConfig;

Updated frontend API call to:

const response = await axios.post("/api/generate-qr", { url });

This allows the browser to safely call the frontend service at:

http://<frontend-lb-ip>/api/generate-qr

...which is internally rewritten to http://backend:8000/generate-qr inside the cluster.

✅ Eliminated ERR_NAME_NOT_RESOLVED DNS error in browser

✅ Clean separation of public and internal routing

 ### ✅ 10. Kubernetes Deployment + Service Setup

Created Kubernetes manifests for backend and frontend:

backend-deployment.yaml and backend-service.yaml

frontend-deployment.yaml and frontend-service.yaml

Used LoadBalancer service type for frontend to expose public IP

Verified service DNS resolution (http://backend:8000) works inside the cluster

Frontend routes API calls through internal /api/generate-qr endpoint (Next.js API route)

Backend returns base64 QR image and blob URL

✅ App confirmed working via LoadBalancer IP from kubectl get svc

---

## 📘 Appendices

### 📘 A. Docker Compose Networking & API URL
- Docker Compose automatically enables internal DNS, so services can talk via their `service name` (e.g., `http://backend:8000`)
- Frontend uses `NEXT_PUBLIC_API_URL` defined in Compose to locate backend
- Hardcoding `localhost` breaks in production — use env vars instead
- ✅ In local dev: define `NEXT_PUBLIC_API_URL=http://backend:8000` in `docker-compose.yml` or `.env`
- ✅ In production: define `NEXT_PUBLIC_API_URL=https://your-api.azurecontainerapps.io` in Azure environment variables
- This ensures frontend dynamically adjusts to its deployment environment

### 🛠️ B. Docker Volumes & File Permission Gotchas
- When using Docker volumes (e.g., `- ./app:/app`), files written inside the container may be owned by `root`, even on your local filesystem
- This can lead to permission issues when switching back to local development outside Docker
- You can fix this by:
  - Running `sudo chown -R $USER:$USER .next` to regain ownership
  - Or deleting the `.next` folder: `rm -rf .next`
- To avoid this altogether, it's best to:
  - **Use a clean internal working directory inside the container** (e.g., `WORKDIR /app`)
  - **Build and run everything inside that isolated directory**
  - Only use volumes for code in live development scenarios
- ✅ Live code changes will still work **if you mount the code as a volume** — even if the `.next/` folder is written inside Docker
- ✅ If you're running as root or switch to root temporarily, you can access and run the backend without issue

### 📁 C. Recommended WORKDIR Usage for Production Containers
- ✅ **Use `/app` for both backend and frontend containers**
  - It's a common convention in Dockerized apps
  - Keeps Dockerfiles clean and consistent
  - Avoids conflicts, even when multiple containers run on the same Kubernetes node
- Each container in AKS has an isolated filesystem. Even if multiple containers use the same `WORKDIR` like `/app`, there is no conflict — they do **not** share the underlying files or directories.
- Backend example:
  ```dockerfile
  WORKDIR /app
  COPY . .
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- Frontend example:
  ```dockerfile
  WORKDIR /app
  COPY . .
  RUN npm run build
  CMD ["npm", "start"]
  ```

### 📦 D. Can I Modify Running Container Files?
- ✅ By default, container filesystems are isolated — changes inside the container are **not visible to your host**, and vice versa
- ❌ If you run a container without a volume, you **cannot modify the code from your host** after the container starts
- ✅ If you **mount your local code folder as a volume**, you can:
  - Edit files on your host, and the changes reflect live inside the container
  - Make use of features like `uvicorn --reload` or hot-reloading in Next.js
- ✅ If you're inside the container as **root**, you can edit any file — but changes are lost on container restart unless backed by a mounted volume
- ✅ In production (e.g., AKS), you typically **do not mount volumes**, and containers are treated as immutable — you redeploy on changes

### 🌐 E. Managing Environment URLs in Local vs Docker
- ✅ In Docker: use `NEXT_PUBLIC_API_URL=http://backend:8000` (Docker DNS name)
- ✅ In local dev (outside Docker): use `NEXT_PUBLIC_API_URL=http://localhost:8000`
  - Put this in a `.env.local` file inside the `front-end-nextjs/` folder
  - Next.js will automatically use it for local development (`npm run dev`)
- ✅ In production: use the live backend URL (e.g. `https://api.yourdomain.com`) via Azure App environment settings
- This ensures your frontend always targets the correct backend for the current environment

