import { NextRequest, NextResponse } from 'next/server';
import { createNotificationStream } from '@/lib/messenger/notifications';

// Endpoint para Server-Sent Events (SSE)
export async function GET(request: NextRequest) {
  // Crear un stream para notificaciones
  const stream = createNotificationStream();
  
  // Configurar headers para SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Para Nginx
  };
  
  // Devolver el stream como respuesta
  return new NextResponse(stream as any, { headers });
}