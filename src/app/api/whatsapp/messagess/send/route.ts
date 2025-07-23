import { supabase } from '@/lib/supabase/server.supabase';
import { appendMessageToConversation } from '@/lib/whatsapp/services/conversation';
import { sendMessageToWhatsApp } from '@/lib/whatsapp/services/send';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Función para descifrar datos
function decryptData(encryptedText: string, secretKey: string): string {
  try {
    // Verificar si el texto tiene el formato esperado para datos cifrados
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText;
    }
    
    // Verificar si tiene el formato de texto cifrado (iv:encrypted)
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return encryptedText;
    }
    
    const [ivHex, encryptedHex] = parts;
    
    // Verificar que ambas partes sean hexadecimales válidas
    if (!ivHex || !encryptedHex || !/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
      return encryptedText;
    }
    
    // Verificar que la clave sea hexadecimal válida y de longitud correcta (32 bytes = 64 caracteres hex)
    if (!secretKey || secretKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(secretKey)) {
      console.warn('[messagess/send] Clave de cifrado inválida o con formato incorrecto');
      return encryptedText;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Si hay error al descifrar, devolver el texto original
    console.warn('[messagess/send] Error al descifrar datos, usando versión sin descifrar:', error);
    return encryptedText;
  }
}

export async function POST(request: Request) {
  try {
    const { phone, message, role, companyId } = await request.json();

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
      return NextResponse.json({ error: 'Error al buscar la compañía' }, { status: 500 });
    }

    if (!company) {
      return NextResponse.json({ error: 'Compañía no encontrada' }, { status: 404 });
    }

    // Descifrar campos cifrados si es necesario
    const secretKey = process.env.ENCRYPTION_KEY || '';
    let phone_number_id = company.phone_number_id;
    let whatsapp_access_token = company.whatsapp_access_token;
    
    if (secretKey) {
      // Descifrar phone_number_id si está cifrado
      if (phone_number_id && phone_number_id.includes(':')) {
        phone_number_id = decryptData(phone_number_id, secretKey);
      }
      
      // Descifrar whatsapp_access_token si está cifrado
      if (whatsapp_access_token && whatsapp_access_token.includes(':')) {
        whatsapp_access_token = decryptData(whatsapp_access_token, secretKey);
      }
    }
    
    // Enviar mensaje a WhatsApp
    const messageId = await sendMessageToWhatsApp({
      to: phone,
      message,
      company: {
        phone_number_id,
        whatsapp_access_token,
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
