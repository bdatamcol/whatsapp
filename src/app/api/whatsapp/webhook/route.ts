import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/whatsapp/whatsapp.handler';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || 'MTT0K3N123';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('Token recibido:', token);

  if (token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return new Response('Token inválido', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Mensaje recibido:', JSON.stringify(body, null, 2));
    
    // ↓↓↓ ESTA ES LA LÍNEA CLAVE QUE FALTA ↓↓↓
    await handleWebhookEvent(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en POST:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}