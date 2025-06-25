// next.config.ts
import type { NextConfig } from 'next';
// next.config.js
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
      };

      config.externals = [
        ...(config.externals || []),
        'mongodb',
        'mongodb-client-encryption',
        'kerberos',
        'supports-color',
        'snappy',
        'aws4'
      ];
    }
    return config;
  },
  experimental: {
    // serverComponentsExternalPackages: ['mongodb'],
    serverActions: {},
  },
  serverExternalPackages: ['mongodb'],
};

export default nextConfig;