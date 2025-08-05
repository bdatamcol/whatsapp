import { NextRequest, NextResponse } from 'next/server';
import { processWebhookRequest } from '@/lib/whatsapp/services/webhookDispatcher';


const mySecretToken = process.env.VERYFY_WEBHOOK_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const challenge = searchParams.get('hub.challenge');
  const verify_token = searchParams.get('hub.verify_token');

  if (mode && verify_token) {
    if (mode === 'subscribe' && verify_token === mySecretToken) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json('Error de validacion', { status: 403 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    return await processWebhookRequest(request);
  } catch (error) {
    console.error('Error en el webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}