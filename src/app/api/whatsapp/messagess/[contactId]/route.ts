import { getMessagesForContact } from '@/lib/whatsapp/services/conversation';
import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: { contactId: string } }) {
  
  try {
    const { contactId } = await context.params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Falta companyId' }, { status: 400 });
    }

    const messages = await getMessagesForContact(contactId, companyId);
    return NextResponse.json(messages);

  } catch (error) {
    console.error('Error en endpoint GET /messages/[contactId]:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }

}
