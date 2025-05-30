import { NextRequest, NextResponse } from 'next/server';
import { Db } from 'mongodb';

// En cualquier archivo que use MongoDB directamente
if (typeof window !== 'undefined') {
  throw new Error('Este módulo solo puede usarse en el servidor');
}

export async function POST(request: NextRequest) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'WEBHOOK_INIT',
    details: 'Iniciando procesamiento de webhook'
  }));

  let client;
  let db: Db;

  try {
    // Conexión a MongoDB
 db = client.db(process.env.MONGODB_DB || 'whatsapp-business');

    // Ping para confirmar conexión
    await db.command({ ping: 1 });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'DB_CONNECTION_SUCCESS',
      dbName: db.databaseName
    }));

    // Lectura del cuerpo del request
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const result = await db.collection('messages').insertOne({
        ...message,
        processedAt: new Date()
      });

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'MESSAGE_SAVED',
        messageId: result.insertedId
      }));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No message found' }, { status: 400 });

  } catch (error: any) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'FATAL_ERROR',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      connectionStatus: {
        hasClient: !!client,
        hasDb: !!db,
        env: {
          MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
          MONGODB_DB: process.env.MONGODB_DB || 'default (whatsapp-business)'
        }
      }
    }));

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
