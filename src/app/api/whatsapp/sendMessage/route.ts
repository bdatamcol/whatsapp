// src/app/api/whatsapp/send/route.ts
import { supabase } from '@/lib/supabase/server.supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { phone, message } = await request.json();

  if (!phone || !message) {
    return NextResponse.json({ error: 'Faltan Datos' }, { status: 400 });
  }

  const sendResp = await fetch(
    `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    }
  );
  const resp = await sendResp.json();
  if (!sendResp.ok) {
    return NextResponse.json({ error: 'Error enviando mensaje...' }, { status: 400 });
  }

  const messageId = resp.messages?.[0]?.id || crypto.randomUUID();

  // Recuperar mensajes actuales
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('messages')
    .eq('phone', phone)
    .maybeSingle();

  if (fetchError) {
    console.error('Error consultando historial:', fetchError);
    return NextResponse.json({ error: 'Error consultando historial' }, { status: 500 });
  }

  // Armar nuevo mensaje
  const newMessage = {
    id: messageId,
    role: 'assistant', // O 'admin' si quieres distinguir
    content: message,
    timestamp: new Date().toISOString(),
    status: 'sent',
  };

  // Actualizar array
  const updatedMessages = [...(existing?.messages || []), newMessage];

  // Hacer upsert con conflicto resuelto por `phone`
  const { error: upsertError } = await supabase
    .from('conversations')
    .upsert({
      phone,
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'phone',
    });

  if (upsertError) {
    console.error('Error guardando mensaje:', upsertError);
    return NextResponse.json({ error: 'Error guardando mensaje' }, { status: 500 });
  }


  return NextResponse.json({ success: true });
}