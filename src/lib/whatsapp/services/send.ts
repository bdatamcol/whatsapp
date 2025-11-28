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
      console.warn('[send] Clave de cifrado inválida o con formato incorrecto');
      return encryptedText;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Si hay error al descifrar, devolver el texto original
    console.warn('[send] Error al descifrar datos, usando versión sin descifrar:', error);
    return encryptedText;
  }
}

export async function sendMessageToWhatsApp({
    to,
    message,
    company,
}: {
    to: string;
    message: string;
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

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${whatsapp_access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
        }),
    });

    const data = await res.json();
    console.log('[DEBUG] Meta API Response:', JSON.stringify(data, null, 2));
    if (!res.ok) {
        console.error('[DEBUG] Meta API Error Details:', data);
        throw new Error(data?.error?.message || 'Error enviando mensaje');
    }
    return data.messages?.[0]?.id || crypto.randomUUID();
}
