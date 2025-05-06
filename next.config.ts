import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignora errores de ESLint durante el build
  },
  typescript: {
    ignoreBuildErrors: true, // Ignora errores de TypeScript durante el build
  },
  env: {
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  }
  // Otras configuraciones pueden ir aquí
};

// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      dns: false,
      net: false,
      tls: false,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
