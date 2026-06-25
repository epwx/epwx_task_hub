const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // forceWebpackBuild: true, // Removed because it is not a valid Next.js option
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/shims/async-storage.ts'),
    };
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
