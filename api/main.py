import os
import base64
import uuid
from io import BytesIO
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import qrcode

from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient, ContentSettings

# --- FastAPI setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Azure Key Vault ---
key_vault_name = os.getenv("AZURE_KEY_VAULT_NAME")
if not key_vault_name:
    raise RuntimeError("AZURE_KEY_VAULT_NAME environment variable not set.")

key_vault_uri = f"https://{key_vault_name}.vault.azure.net"

credential = DefaultAzureCredential()
secret_client = SecretClient(vault_url=key_vault_uri, credential=credential)

try:
    AZURE_CONN_STR = secret_client.get_secret("AZURE-STORAGE-CONNECTION-STRING").value
    CONTAINER_NAME = secret_client.get_secret("AZURE-CONTAINER-NAME").value
except Exception as e:
    import traceback
    print("❌ Error loading secrets from Key Vault:")
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"Secret load failed: {str(e)}")

# --- Azure Blob setup ---
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
container_client = blob_service_client.get_container_client(CONTAINER_NAME)

# Optional: log container use (no creation here)
print(f"✅ Using container: {CONTAINER_NAME}")


# --- Data model for input ---
class QRRequest(BaseModel):
    url: str


# --- Background task for blob upload ---
def upload_to_blob(file_name, img_bytes):
    try:
        blob_client = container_client.get_blob_client(file_name)
        blob_client.upload_blob(
            BytesIO(img_bytes),
            blob_type="BlockBlob",
            content_settings=ContentSettings(content_type='image/png'),
            overwrite=True
        )
        print(f"✅ Uploaded to blob: {file_name}")
    except Exception as e:
        print(f"❌ Upload failed for {file_name}: {e}")


# --- Main QR generation route ---
@app.post("/generate-qr/")
async def generate_qr(data: QRRequest, background_tasks: BackgroundTasks):
    url = data.url

    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert image to byte stream
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    # Generate unique ID and filename
    unique_id = str(uuid.uuid4())
    file_name = f"qr_codes/{unique_id}.png"

    # Convert to base64 string for browser preview
    encoded_img = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
    data_url = f"data:image/png;base64,{encoded_img}"

    # Upload in background
    background_tasks.add_task(upload_to_blob, file_name, img_byte_arr.getvalue())

    return {
        "qr_image": data_url,
        "id": unique_id
    }
