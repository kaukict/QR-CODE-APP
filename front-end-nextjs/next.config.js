/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://backend:8000/:path*' // backend is reachable from inside the container
        }
      ]
    }
  };
  
  module.exports = nextConfig;
  