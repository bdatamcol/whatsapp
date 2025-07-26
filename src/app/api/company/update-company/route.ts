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

// Función para verificar si un texto está cifrado
function isEncrypted(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const parts = text.split(':');
  return parts.length === 2 && /^[0-9a-fA-F]+$/.test(parts[0]) && /^[0-9a-fA-F]+$/.test(parts[1]);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const profile = await getUserProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener datos de la solicitud
    const companyData = await req.json();
    if (!companyData || Object.keys(companyData).length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron datos para actualizar' }, { status: 400 });
    }

    // 3. Preparar datos para actualización
    const secretKey = process.env.ENCRYPTION_KEY || '';
    const updateData: any = {};

    // Campos que no necesitan cifrado
    if (companyData.name !== undefined) {
      updateData.name = companyData.name;
    }
    if (companyData.whatsapp_number !== undefined) {
      updateData.whatsapp_number = companyData.whatsapp_number;
    }

    // Campos que necesitan cifrado
    const fieldsToEncrypt = [
      'prompt',
      'phone_number_id',
      'whatsapp_access_token',
      'meta_app_id',
      'waba_id',
      'facebook_access_token',
      'facebook_ad_account_id',
      'marketing_account_id',
      'facebook_catalog_id'
    ];

    for (const field of fieldsToEncrypt) {
      if (companyData[field] !== undefined && companyData[field] !== null && companyData[field] !== '') {
        // Solo cifrar si no está ya cifrado y tenemos clave de cifrado
        if (secretKey && !isEncrypted(companyData[field])) {
          updateData[field] = encryptData(companyData[field], secretKey);
        } else {
          updateData[field] = companyData[field];
        }
      }
    }

    // 4. Actualizar en la base de datos
    const { error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', profile.company_id);

    if (error) {
      console.error('Error al actualizar empresa:', error);
      return NextResponse.json({ error: 'Error al actualizar los datos de la empresa' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Datos de empresa actualizados correctamente' });
  } catch (error) {
    console.error('Error en update-company:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}