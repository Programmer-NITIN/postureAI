/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Proxy WebSocket signaling to the backend
      {
        source: "/ws/:path*",
        destination: "http://localhost:8000/ws/:path*",
      },
      // Proxy REST API calls to the backend
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
