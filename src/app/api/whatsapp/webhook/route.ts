import { NextRequest, NextResponse } from 'next/server';
import IAService from '@/lib/ia/IAService';
import { getConversation, updateConversation } from '@/lib/ia/memory';
import { upsertContact } from '@/lib/whatsapp/contacts';
import { supabase } from '@/lib/supabase/server.supabase';
import { findCityIdInText } from '@/lib/utils/cityMatcher';
import { getAllCitiesCached } from '@/lib/utils/cityCache';

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
  // console.log(JSON.stringify(data, null, 2));// para imprimir en consola el json

  const entry = data.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  //Manejo del evento del estado: enviado, leido, entregado
  const statusEvent = value?.statuses?.[0];
  if (statusEvent) {
    const messageId = statusEvent.id;
    const recipient = statusEvent.recipient_id;
    const status = statusEvent.status;
    if (status === 'read') {
      //Llamar a una función de supabase si guardas estado
      await supabase.rpc('mark_message_as_read', {
        phone_input: recipient,
        message_id: messageId
      });

      return NextResponse.json({ status: 'Estado leído registrado' });
    }
    return NextResponse.json({ status: `Evento de estado ignorado: ${status}` });
  }

  //Validar que el mensaje sea de texto y que no sea un mensaje vacio
  const hasMessage = change?.value?.messages?.[0];
  if (!hasMessage || !hasMessage.text?.body || hasMessage.text.body.trim() === '') {
    return NextResponse.json({ error: 'No message found' }, { status: 400 });
  }

  const message = hasMessage;
  const from = message.from;// numero de telefono de quien escribe
  const text = message.text?.body || '';// mensaje que envia
  const phoneNumberId = change.value.metadata.phone_number_id;
  const name = change.value.contacts?.[0]?.profile?.name || 'Desconocido';
  const timestamp = message.timestamp ? new Date(message.timestamp * 1000).toISOString() : new Date().toISOString();


  const cities = await getAllCitiesCached();
  const cityId = await findCityIdInText(text, cities);
  if (cityId) {
    await supabase
      .from('contacts')
      .update({ city_id: cityId })
      .eq('phone', from);
  }

  await upsertContact({
    phone: from,
    name,
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
  });

  const history = await getConversation(from);
  const updatedMessages = [
    ...history,
    { id: message.id, role: 'user', content: text, timestamp }
  ];

  const iaResponse = await IAService.askSmart(from, text);

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
    if (!response.ok) throw new Error(JSON.stringify(data));

    const messageId = data?.messages?.[0]?.id || crypto.randomUUID();
    updatedMessages.push({
      id: messageId,
      role: 'assistant',
      content: iaResponse,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    await updateConversation(from, updatedMessages);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    return NextResponse.json({ error: 'Error al enviar el mensaje' }, { status: 500 });
  }
}