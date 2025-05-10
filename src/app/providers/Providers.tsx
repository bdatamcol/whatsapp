'use client';
import { WhatsAppProvider } from './WhatsAppProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <WhatsAppProvider>{children}</WhatsAppProvider>;
}