'use client'; // Solo este archivo es cliente

import { WhatsAppProvider } from '@/app/providers/WhatsAppProvider'; // CORREGIDO: sin /app

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WhatsAppProvider>
      {children}
    </WhatsAppProvider>
  );
}
