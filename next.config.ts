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
        mongodb: false,
      };

      config.plugins.push(
        new config.webpack.IgnorePlugin({
          resourceRegExp: /^(zstd|kerberos|mongocrypt|snappy)\.node$/,
          contextRegExp: /node_modules/,
        }),
        new config.webpack.IgnorePlugin({
          resourceRegExp: /^mongodb$/,
          contextRegExp: /node_modules/,
        })
      );
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
    serverActions: true,
  },
};

export default nextConfig;