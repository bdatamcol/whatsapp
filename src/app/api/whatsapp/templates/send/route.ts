import { supabase } from '@/lib/supabase/server.supabase';
import { appendMessageToConversation } from '@/lib/whatsapp/services/conversation';
import { sendTemplateMessage } from '@/lib/whatsapp/services/sendTemplateMessage';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Función para descifrar datos
function decryptData(encryptedText: string, secretKey: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;
    const [ivHex, encryptedHex] = parts;
    if (!ivHex || !encryptedHex || !/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) return encryptedText;
    if (!secretKey || secretKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(secretKey)) return encryptedText;
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.warn('[templates/send] Error al descifrar datos:', error);
    return encryptedText;
  }
}

export async function POST(request: Request) {
  try {
    const { phone, templateName, language = 'es', components, companyId } = await request.json();

    if (!phone || !templateName || !companyId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, phone_number_id, whatsapp_access_token')
      .eq('id', companyId)
      .maybeSingle();

    if (error || !company) {
      return NextResponse.json({ error: 'Compañía no encontrada' }, { status: 404 });
    }

    const secretKey = process.env.ENCRYPTION_KEY || '';
    let phone_number_id = company.phone_number_id;
    let whatsapp_access_token = company.whatsapp_access_token;
    
    if (secretKey) {
      if (phone_number_id && phone_number_id.includes(':')) {
        phone_number_id = decryptData(phone_number_id, secretKey);
      }
      if (whatsapp_access_token && whatsapp_access_token.includes(':')) {
        whatsapp_access_token = decryptData(whatsapp_access_token, secretKey);
      }
    }
    
    // Enviar template
    const response = await sendTemplateMessage({
      to: phone,
      company: {
        phone_number_id,
        whatsapp_access_token,
      },
      templateName,
      languageCode: language,
      components
    });

    const messageId = response.messages?.[0]?.id || crypto.randomUUID();
    const summaryText = `[Plantilla enviada: ${templateName}]`;

    // Guardar en conversación
    await appendMessageToConversation(phone, summaryText, messageId, companyId, 'assistant');

    return NextResponse.json({ success: true, messageId }, { status: 200 });

  } catch (error) {
    console.error('Error en /templates/send:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}