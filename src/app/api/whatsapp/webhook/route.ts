import { NextRequest, NextResponse } from 'next/server';

// Token de verificación (DEBE coincidir con el de Meta)
const VERIFY_TOKEN = 'MTT0K3N123'; 

// GET: Verificación del webhook por Meta
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Debug: Registra el token recibido (verifica en logs de Vercel)
  console.log('Token recibido:', token);

  if (token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }, // ¡Meta espera texto plano!
    });
  }
  return new Response('Token inválido', { status: 403 });
}

// POST: Manejo de mensajes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Mensaje recibido:', JSON.stringify(body, null, 2)); // Debug
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en POST:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}