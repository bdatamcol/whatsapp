// src/middlewares/whatsapp/whatsapp.verification.ts
import { NextRequest } from 'next/server';

export function verifyWebhook(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  return {
    valid: token === process.env.WHATSAPP_WEBHOOK_TOKEN,
    challenge: request.nextUrl.searchParams.get('hub.challenge')
  };
}