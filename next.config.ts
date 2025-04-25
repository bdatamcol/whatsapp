import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignora errores de ESLint durante el build
  },
  typescript: {
    ignoreBuildErrors: true, // Ignora errores de TypeScript durante el build
  },
  // Otras configuraciones pueden ir aquí
};

export default nextConfig;