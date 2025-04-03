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

