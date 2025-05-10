// src/app/api/whatsapp/messages/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import type { Message } from '@/types/whatsapp.d';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is not defined');

const client = new MongoClient(uri);
const dbName = process.env.MONGODB_DB || 'whatsapp-business';

export const dynamic = 'force-dynamic';

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

  let clientInstance;
  
  try {
    clientInstance = await client.connect();
    const db = clientInstance.db(dbName);

    const query: any = {
      $or: [{ from: contactId }, { to: contactId }]
    };

    if (before) {
      query.timestamp = { $lt: before };
    }

    const messages = await db.collection('messages')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .map(msg => ({
        ...msg,
        id: msg._id.toString(),
        timestamp: msg.timestamp.toISOString()
      }))
      .toArray();

    return NextResponse.json(messages);

  } catch (error) {
    console.error('Error en GET /api/whatsapp/messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  } finally {
    if (clientInstance) await clientInstance.close();
  }
}

export async function POST(request: Request) {
  let clientInstance;

  try {
    const message: Message = await request.json();
    
    if (!message.from || !message.timestamp) {
      return NextResponse.json(
        { error: 'Datos del mensaje incompletos' },
        { status: 400 }
      );
    }

    clientInstance = await client.connect();
    const db = clientInstance.db(dbName);

    const messageToInsert = {
      ...message,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('messages').insertOne(messageToInsert);

    const savedMessage = {
      ...messageToInsert,
      _id: result.insertedId.toString(),
      id: result.insertedId.toString()
    };

    return NextResponse.json(savedMessage);

  } catch (error) {
    console.error('Error en POST /api/whatsapp/messages:', error);
    return NextResponse.json(
      { error: 'Error al guardar mensaje' },
      { status: 500 }
    );
  } finally {
    if (clientInstance) await clientInstance.close();
  }
}