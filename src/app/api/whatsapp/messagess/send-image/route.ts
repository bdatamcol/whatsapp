import { supabase } from '@/lib/supabase/server.supabase';
import { appendImageMessageToConversation } from '@/lib/whatsapp/services/appendImageMessage';
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
      console.warn('[send-image] Clave de cifrado inválida o con formato incorrecto');
      return encryptedText;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Si hay error al descifrar, devolver el texto original
    console.warn('[send-image] Error al descifrar datos, usando versión sin descifrar:', error);
    return encryptedText;
  }
}

// Función para enviar imagen a WhatsApp
async function sendImageToWhatsApp({
    to,
    imageUrl,
    caption,
    company,
}: {
    to: string;
    imageUrl: string;
    caption?: string;
    company: {
        phone_number_id: string;
        whatsapp_access_token: string;
    };
}) {
    // Descifrar datos si están cifrados
    let phone_number_id = company.phone_number_id;
    let whatsapp_access_token = company.whatsapp_access_token;
    
    // Verificar si hay clave de cifrado y descifrar si es necesario
    const secretKey = process.env.ENCRYPTION_KEY || '';
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
    
    const version = process.env.META_API_VERSION || 'v18.0';
    const url = `https://graph.facebook.com/${version}/${phone_number_id}/messages`;

    const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: {
            link: imageUrl,
        },
    };

    if (caption) {
        payload.image.caption = caption;
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${whatsapp_access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Error enviando imagen');
    return data.messages?.[0]?.id || crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const phone = formData.get('phone') as string;
    const companyId = formData.get('companyId') as string;
    const role = formData.get('role') as string || 'assistant';

    if (!imageFile || !phone || !companyId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo JPG y PNG están permitidos.' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB permitido.' },
        { status: 400 }
      );
    }

    // Obtener datos de la empresa
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, phone_number_id, whatsapp_access_token')
      .eq('id', companyId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Error al buscar la compañía' },
        { status: 500 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Compañía no encontrada' },
        { status: 404 }
      );
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

    // Generar nombre único para el archivo
    const fileExtension = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const filePath = `whatsapp-images/${companyId}/${phone}/${fileName}`;

    // Subir imagen a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error al subir imagen:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir la imagen' },
        { status: 500 }
      );
    }

    // Obtener URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    // Enviar imagen a WhatsApp
    const messageId = await sendImageToWhatsApp({
      to: phone,
      imageUrl: publicUrl,
      caption: imageFile.name,
      company: {
        phone_number_id,
        whatsapp_access_token,
      },
    });

    // Agregar mensaje de imagen a la conversación
    await appendImageMessageToConversation(phone, `📸 ${imageFile.name}`, publicUrl, messageId, companyId, role);

    return NextResponse.json({ success: true, messageId, imageUrl: publicUrl }, { status: 200 });

  } catch (error) {
    console.error('Error en /send-image:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}