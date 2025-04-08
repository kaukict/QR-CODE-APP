'use client'

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [url, setUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `/api/generate-qr?url=${encodeURIComponent(url)}`
      );
  
      // Set the base64 image returned from backend
      setQrCodeUrl(response.data.qr_image);
      console.log("Setting QR image from:", response.data.qr_image);
  
      // Optional: store the blob ID for future use
      console.log("QR code ID (used in blob):", response.data.id);
  
    } catch (error) {
      console.error("Error generating QR Code:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>QR Code Generator</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL like https://example.com"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Generate QR Code</button>
      </form>
      {qrCodeUrl && (
         <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <img
            src={qrCodeUrl}
           alt="Generated QR Code"
           style={{ width: '300px', height: '300px' }}
            />

        <div style={{ marginTop: '1rem' }}>
          <a
           href={qrCodeUrl}
           download="qr-code.png"
           style={{
           display: 'inline-block',
           padding: '0.5rem 1rem',
           backgroundColor: '#0070f3',
           color: '#fff',
           borderRadius: '4px',
           textDecoration: 'none'
           }}
           >
        Download QR Code
      </a>
    </div>
  </div>
)}
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    color: 'white',
  },
  title: {
    margin: '0',
    lineHeight: '1.15',
    fontSize: '4rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: 'none',
    marginTop: '20px',
    width: '300px',
    color: '#121212'

  },
  button: {
    padding: '10px 20px',
    marginTop: '20px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#0070f3',
    color: 'white',
    cursor: 'pointer',
  },
  qrCode: {
    marginTop: '20px',
  },
};
