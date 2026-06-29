import type { NextConfig } from "next";
const { withPlausibleProxy } = require('next-plausible')

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image optimization
  images: {
    remotePatterns: [],
  },
  
  // Turbopack is now the default bundler in Next.js 16
  // No additional configuration needed

  // Redirect nav pages to coming-soon
  async redirects() {
    return [
      // {
      //   source: '/',
      //   destination: '/coming-soon',
      //   permanent: false,
      // },
      // {
      //   source: '/about',
      //   destination: '/coming-soon',
      //   permanent: false,
      // },
      // {
      //   source: '/candidates',
      //   destination: '/coming-soon',
      //   permanent: false,
      // },
      // {
      //   source: '/events',
      //   destination: '/coming-soon',
      //   permanent: false,
      // },
      // {
      //   source: '/join-us',
      //   destination: '/coming-soon',
      //   permanent: false,
      // },
    ];
  },
};

const plausibleConfig = {
  customDomain: 'https://analytics.serubin.net',
  scriptName: 'ps',
  selfHosted: true,
  trackOutboundLinks: true,
  taggedEvents: true,
}

module.exports = withPlausibleProxy(plausibleConfig)(nextConfig);
