import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  },
  webpack: (config) => {
    // Configuración de aliases para resolver los paths correctamente
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
    };
    return config;
  },
  // Opcional: Configuración para transpilar módulos necesarios
  transpilePackages: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
};

export default nextConfig;