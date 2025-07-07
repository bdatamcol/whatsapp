import { getMessagesForContact } from '@/lib/whatsapp/services/conversation';
import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: { contactId: string } }) {
  
  try {
    const { contactId } = await context.params;
    const messages = await getMessagesForContact(contactId);
    return NextResponse.json(messages);

  } catch (error) {
    console.error('Error en endpoint GET /messages/[contactId]:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }

}
