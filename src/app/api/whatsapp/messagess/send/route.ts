import { supabase } from '@/lib/supabase/server.supabase';
import { appendMessageToConversation } from '@/lib/whatsapp/services/conversation';
import { sendMessageToWhatsApp } from '@/lib/whatsapp/services/send';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, message, role, companyId } = await request.json();

    // console.log({ phone, message, role, companyId });

    if (!phone || !message || !companyId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Buscar compañía directamente por companyId
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, phone_number_id, whatsapp_access_token')
      .eq('id', companyId)
      .maybeSingle();

    if (error) {
      // console.error('[getCompanyById] Error:', error.message);
      return NextResponse.json({ error: 'Error al buscar la compañía' }, { status: 500 });
    }

    if (!company) {
      return NextResponse.json({ error: 'Compañía no encontrada' }, { status: 404 });
    }

    // Enviar mensaje a WhatsApp
    const messageId = await sendMessageToWhatsApp({
      to: phone,
      message,
      company: {
        phone_number_id: company.phone_number_id,
        whatsapp_access_token: company.whatsapp_access_token,
      },
    });

    // Agregar mensaje a la conversación
    await appendMessageToConversation(phone, message, messageId, role);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error en /messagess/send:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
