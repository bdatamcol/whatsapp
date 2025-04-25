import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const messages = await db.collection('messages').find().toArray();

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener los mensajes.' }, { status: 500 });
  }
}

