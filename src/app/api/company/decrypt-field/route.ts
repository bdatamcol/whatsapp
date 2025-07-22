import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
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
      console.warn('[decrypt-field] Clave de cifrado inválida o con formato incorrecto');
      return encryptedText;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Si hay error al descifrar, devolver el texto original
    console.warn('[decrypt-field] Error al descifrar datos, usando versión sin descifrar:', error);
    return encryptedText;
  }
}

// Campos permitidos para descifrar
const allowedFields = ['phone_number_id', 'whatsapp_access_token', 'meta_app_id', 'waba_id', 'prompt'];

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserProfile();
    if (!user || !user.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos de la solicitud
    const { field } = await request.json();

    // Validar campo
    if (!field || !allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Campo no válido' }, { status: 400 });
    }

    // Definir el tipo de respuesta de la empresa
    type CompanyResponse = {
      id: string;
      prompt?: string | null;
      phone_number_id?: string | null;
      whatsapp_access_token?: string | null;
      meta_app_id?: string | null;
      waba_id?: string | null;
      [key: string]: string | null | undefined;
    };

    // Obtener la empresa del usuario
    const { data: company, error } = await supabase
      .from('companies')
      .select(`id, ${field}`)
      .eq('id', user.company_id)
      .maybeSingle() as { data: CompanyResponse | null, error: any };

    if (error || !company) {
      console.error('[decrypt-field] Error al obtener empresa:', error);
      return NextResponse.json({ error: 'Error al obtener datos de la empresa' }, { status: 500 });
    }
    // Verificar que el usuario pertenece a la empresa
    if (company.id !== user.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la clave de cifrado
    const secretKey = process.env.ENCRYPTION_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    // Descifrar el campo
    const encryptedValue = company[field];
    const decryptedValue = decryptData(encryptedValue, secretKey);

    // Devolver el valor descifrado
    return NextResponse.json({ value: decryptedValue });
  } catch (error) {
    console.error('[decrypt-field] Error:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}