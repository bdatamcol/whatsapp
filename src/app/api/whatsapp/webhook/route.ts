import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/app/middlewares/whatsapp/whatsapp.verification';
import { handleWebhookEvent } from '@/lib/whatsapp/whatsapp.handler';

// GET: Para verificación inicial por Meta
export async function GET(request: NextRequest) {
  const { valid, challenge } = verifyWebhook(request);
  return valid 
    ? NextResponse.json(challenge) 
    : NextResponse.json({ error: 'Token inválido' }, { status: 403 });
}

// POST: Recibe mensajes en tiempo real
export async function POST(request: NextRequest) {
  const body = await request.json();
  await handleWebhookEvent(body); // Procesa el mensaje
  return NextResponse.json({ success: true });
}