import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await axios.post(
      "http://backend:8000/generate-qr/",
      { url }, // send in body, not query string
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("🔍 Checking backend values from FastAPI response:");
    console.log("qr_image_base64:", response.data.qr_image_base64);
    console.log("qr_code_url:", response.data.qr_code_url);
    console.log("Full backend response:", response.data);
    
    // Return everything your frontend expects
    return NextResponse.json({
      qr_image: response.data.qr_image_base64,
      qr_code_url: response.data.qr_code_url,
      id: response.data.id || null // Optional: include ID if your backend returns one
    });

  } catch (error) {
    console.error('Error generating QR Code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR Code' },
      { status: 500 }
    );
  }
}