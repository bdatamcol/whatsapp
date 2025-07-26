import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import crypto from 'crypto';

// Función para cifrar datos
function encryptData(text: string, secretKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

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
      console.warn('[update-prompt] Clave de cifrado inválida o con formato incorrecto');
      return encryptedText;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Si hay error al descifrar, devolver el texto original
    console.warn('[update-prompt] Error al descifrar datos, usando versión sin descifrar:', error);
    return encryptedText;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const profile = await getUserProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener datos de la solicitud
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 });
    }

    // 3. Cifrar el prompt
    const secretKey = process.env.ENCRYPTION_KEY;
    const encryptedPrompt = encryptData(prompt, secretKey);

    // 4. Actualizar en la base de datos usando el cliente del servidor
    const { error } = await supabase
      .from('companies')
      .update({ prompt: encryptedPrompt })
      .eq('id', profile.company_id);

    if (error) {
      console.error('Error al actualizar prompt:', error);
      return NextResponse.json({ error: 'Error al actualizar el prompt' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en update-prompt:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const profile = await getUserProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener el prompt cifrado
    const { data, error } = await supabase
      .from('companies')
      .select('prompt')
      .eq('id', profile.company_id)
      .maybeSingle();

    if (error || !data) {
      console.error('Error al obtener prompt:', error);
      return NextResponse.json({ error: 'Error al obtener el prompt' }, { status: 500 });
    }

    // 3. Si no hay prompt, devolver vacío
    if (!data.prompt) {
      return NextResponse.json({ prompt: '' });
    }

    // 4. Descifrar el prompt
    try {
      const secretKey = process.env.ENCRYPTION_KEY || '';
      const decryptedPrompt = decryptData(data.prompt, secretKey);
      return NextResponse.json({ prompt: decryptedPrompt });
    } catch (decryptError) {
      // Si hay error al descifrar (posiblemente porque no está cifrado aún)
      return NextResponse.json({ prompt: data.prompt });
    }
  } catch (error) {
    console.error('Error en get-prompt:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}