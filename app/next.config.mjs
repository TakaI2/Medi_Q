/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for portable deployment
  output: 'standalone',

  // Production optimizations
  reactStrictMode: true,

  // Disable telemetry for offline deployment
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Optimize for production
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
