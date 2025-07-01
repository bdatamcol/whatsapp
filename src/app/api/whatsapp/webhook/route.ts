import { NextRequest, NextResponse } from 'next/server';
import IAService from '@/lib/ia/IAService';
import { getConversation, updateConversation } from '@/lib/ia/memory';

const token_meta = process.env.WHATSAPP_API_TOKEN;
const mySecretToken = process.env.VERYFY_WEBHOOK_SECRET;
const baseUrl = 'https://graph.facebook.com';
const version = process.env.META_API_VERSION;

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

  const data = await request.json();
  // para imprimir en consola el json

  const entry = data.entry?.[0];
  const change = entry?.changes?.[0];

  const hasMessage = change?.value?.messages?.[0];

  //TODO: validar que el mensaje sea de texto y que no sea un mensaje vacio

  if (!hasMessage || !hasMessage.text?.body || hasMessage.text.body.trim() === '') {
    return NextResponse.json({ error: 'No message found' }, { status: 400 });
  }

  if (!hasMessage ) {
    return NextResponse.json({ error: 'No message found' }, { status: 400 });
  }
  const message = hasMessage;
  const from = message.from;// numero de telefono de quien escribe
  const text = message.text?.body || '';// mensaje que envia
  const phoneNumberId = change.value.metadata.phone_number_id;

  const history = await getConversation(from);

  const updatedMessages = [...history, { role: 'user', content: text }];

  // const aiResponse = await askOpenRouterWithHistory(updatedMessages);
  const iaResponse = await IAService.askSmart(from, text);

  updatedMessages.push({ role: 'assistant', content: iaResponse });
  await updateConversation(from, updatedMessages);

  //enviamos la respuesta por whatsapp
  try {
    const response = await fetch(`${baseUrl}/${version}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token_meta}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: from,
        type: 'text',
        text: { body: iaResponse },
      }),
    });

    const data = await response.json();

    if(!response.ok) throw new Error(JSON.stringify(data));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    return NextResponse.json({ error: 'Error al enviar el mensaje' }, { status: 500 });
  }
}