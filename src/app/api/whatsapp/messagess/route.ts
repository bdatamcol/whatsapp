// src/app/api/whatsapp/messages/route.ts
import { NextResponse } from 'next/server';
import { getMessagesByContact, saveMessageToDatabase } from '@/lib/whatsapp/database/message-repository';
import { Message } from '@/types/whatsapp.d';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contact');
  const before = searchParams.get('before');
  
  if (!contactId) {
    return NextResponse.json(
      { error: 'Se requiere el parámetro contact' },
      { status: 400 }
    );
  }

  try {
    const messages = await getMessagesByContact(contactId, 50, before || undefined);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error en GET /api/whatsapp/messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const message: Message = await request.json();
    
    if (!message.from || !message.timestamp) {
      return NextResponse.json(
        { error: 'Datos del mensaje incompletos' },
        { status: 400 }
      );
    }

    const savedMessage = await saveMessageToDatabase(message);
    return NextResponse.json(savedMessage);
  } catch (error) {
    console.error('Error en POST /api/whatsapp/messages:', error);
    return NextResponse.json(
      { error: 'Error al guardar mensaje' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; // Asegura que la ruta sea dinámica