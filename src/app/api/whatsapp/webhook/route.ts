import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'WEBHOOK_INIT',
    details: 'Iniciando procesamiento de webhook'
  }));

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no está definido');
    return NextResponse.json(
      { error: 'Configuración incorrecta del servidor' },
      { status: 500 }
    );
  }

  let client;
  let db;

  try {
    // Conexión directa sin pool (mejor para serverless)
    client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000
    });
    
    await client.connect();
    db = client.db(process.env.MONGODB_DB || 'whatsapp-business');

    // Verificación de conexión
    await db.command({ ping: 1 });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'DB_CONNECTION_SUCCESS',
      dbName: db.databaseName
    }));

    // Procesamiento del mensaje
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ error: 'No message found' }, { status: 400 });
    }

    // Guardar mensaje
    const result = await db.collection('messages').insertOne({
      ...message,
      processedAt: new Date(),
      direction: 'inbound'
    });

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'MESSAGE_SAVED',
      messageId: result.insertedId
    }));

    return NextResponse.json({ success: true });

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
        hasDb: !!db
      }
    }));

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    // Cierra la conexión siempre
    if (client) {
      setTimeout(() => client.close(), 2000); // Cierre asíncrono
    }
  }
}