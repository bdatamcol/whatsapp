// src/app/api/whatsapp/contacts/route.ts
import { NextResponse } from 'next/server';
import WhatsAppClient from '@/lib/whatsapp/whatsapp.client';
import { Contact } from '@/types/whatsapp.d';

// GET: Obtener contactos
export async function GET() {
  const client = new WhatsAppClient();
  try {
    // Mock para pruebas (reemplázalo con tu lógica real)
    const mockContacts: Contact[] = [
      {
        id: "1234567890",
        name: "Cliente Ejemplo",
        lastMessage: "Hola, ¿cómo estás?",
        unread: 2,
        lastMessageTime: new Date().toISOString()
      }
    ];
    return NextResponse.json(mockContacts);

    // Para producción, usa esto:
    // const contacts = await client.getContacts();
    // return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener contactos' },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo contacto (opcional)
export async function POST(request: Request) {
  // Implementa según tus necesidades
  return NextResponse.json({ error: 'Método no implementado' }, { status: 501 });
}