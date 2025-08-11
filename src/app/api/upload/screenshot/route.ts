import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client.supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no debe superar 5MB' }, { status: 400 });
    }

    const fileName = `bug-screenshots/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.type.split('/')[1]}`;

    // Convertir archivo a ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await supabase.storage
      .from('bug-reports')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error de Supabase:', error);
      return NextResponse.json({
        error: `Error al subir imagen: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('bug-reports')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}