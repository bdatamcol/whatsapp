// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest) {
  // 1. Manejo de redirección www -> non-www
  const url = new URL(request.url);
  if (url.hostname.startsWith('www.')) {
    const newUrl = url.toString().replace('//www.', '//');
    return NextResponse.redirect(newUrl, 301);
  }

  // 2. Verificación del token
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN;

  console.log('[WEBHOOK] Token recibido:', token);
  console.log('[WEBHOOK] Token esperado:', expectedToken);

  if (token === expectedToken) {
    const challenge = request.nextUrl.searchParams.get('hub.challenge');
    console.log('[WEBHOOK] Verificación exitosa, retornando challenge');
    return new Response(challenge, { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      }
    });
  }

  console.error('[WEBHOOK] Error: Token inválido');
  return new Response('Token inválido', { 
    status: 403,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Manejo de redirección www -> non-www
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.')) {
      const newUrl = url.toString().replace('//www.', '//');
      return NextResponse.redirect(newUrl, 307);
    }

    // 2. Procesamiento de mensajes
    const body = await request.json();
    console.log('[WEBHOOK] Mensaje recibido:', JSON.stringify(body, null, 2));

    // Aquí añade tu lógica para manejar los mensajes
    // Ejemplo básico:
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry;
      for (const entry of entries) {
        // Procesa cada entrada
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[WEBHOOK] Error procesando mensaje:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}