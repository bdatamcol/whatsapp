// src/app/api/utils/env.ts

export const env = {
  API_VERSION: process.env.NEXT_PUBLIC_WHATSAPP_API_VERSION || 'v18.0',
  BUSINESS_PHONE: process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '',
  API_TOKEN: process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN || '',
  OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '', // ← ✅ esta es la línea que faltaba
};