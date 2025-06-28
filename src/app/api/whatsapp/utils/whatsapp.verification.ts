import { NextRequest } from 'next/server';

export function verifyWebhook(request: NextRequest): {
  valid: boolean;
  challenge: string | null;
} {
  // 1. Verificar variables de entorno
  const token = process.env.WHATSAPP_WEBHOOK_TOKEN;
  if (!token) {
    console.error('[WEBHOOK] WHATSAPP_WEBHOOK_TOKEN no está definido');
    return { valid: false, challenge: null };
  }

  // 2. Extraer parámetros
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const receivedToken = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // 4. Validación estricta
  return {
    valid: mode === 'subscribe' && receivedToken === token,
    challenge
  };
}