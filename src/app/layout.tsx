import { Inter, Roboto_Mono } from "next/font/google";
import { Toaster } from '@/components/ui/sonner'
import "./globals.css";
import type { Metadata } from 'next';
import { Providers } from './providers';
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM | BDATAM",
  description: "Plataforma integral de gestión de clientes y WhatsApp Business para empresas",
  keywords: ["whatsapp business", "gestión clientes", "mensajería", "crm"],
  authors: [{ name: "WhatsApp Business Platform" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
