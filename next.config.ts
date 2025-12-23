import { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kqilbhvuxevjrsyhfrfu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
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
        'kerberos',
        'supports-color',
        'snappy',
        'aws4'
      ];
    }
    return config;
  }
};

export default nextConfig;