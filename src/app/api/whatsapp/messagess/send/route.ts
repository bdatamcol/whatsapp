import { appendMessageToConversation } from '@/lib/whatsapp/services/conversation';
import { sendTextMessageToWhatsApp } from '@/lib/whatsapp/services/send';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {

  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'Faltan Datos' }, { status: 400 });
    }

    const messageId = await sendTextMessageToWhatsApp(phone, message);
    await appendMessageToConversation(phone, message, messageId);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}