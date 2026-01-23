import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image optimization
  images: {
    remotePatterns: [],
  },
  
  // Turbopack is now the default bundler in Next.js 16
  // No additional configuration needed

  // Redirect all routes to coming-soon page
  async redirects() {
    return [
      {
        source: '/',
        destination: '/coming-soon',
        permanent: false,
      },
      {
        source: '/about',
        destination: '/coming-soon',
        permanent: false,
      },
      {
        source: '/candidates',
        destination: '/coming-soon',
        permanent: false,
      },
      {
        source: '/get-involved',
        destination: '/coming-soon',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
