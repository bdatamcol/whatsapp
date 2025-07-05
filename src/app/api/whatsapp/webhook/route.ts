import { NextRequest, NextResponse } from 'next/server';
import { handleStatusEvent } from '@/lib/whatsapp/services/handleStatusEvent';
import { handleIncomingMessage } from '@/lib/whatsapp/services/handleIncomingMessage';


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
    const data = await request.json();
    // console.log(JSON.stringify(data, null, 2));// para imprimir en consola el json
    const entry = data.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    //Manejo del evento del estado: enviado, leido, entregado
    const statusEvent = value?.statuses?.[0];
    if (statusEvent) {
      const result = await handleStatusEvent(statusEvent);
      if (result) return result;
    }

    //Validar que el mensaje sea de texto y que no sea un mensaje vacio
    const hasMessage = change?.value?.messages?.[0];
    // console.log('Mensaje recibido del cliente:', JSON.stringify(hasMessage, null, 2));
    // Acepta solo tipos válidos
    const allowedTypes = ['text', 'button'];
    if (!allowedTypes.includes(hasMessage.type)) {
      return NextResponse.json({ error: `Unsupported message type: ${hasMessage.type}` }, { status: 200 });
    }
    //Manejo del mensaje de texto
    await handleIncomingMessage(hasMessage, value);
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

}