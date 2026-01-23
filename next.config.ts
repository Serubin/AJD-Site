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
};

export default nextConfig;
