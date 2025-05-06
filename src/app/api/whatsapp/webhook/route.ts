import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI no está configurado');
  NextResponse.json(
    { error: 'Configuración del servidor incompleta' },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  console.log('Iniciando procesamiento de webhook');
  
  let client;
  try {
    // Conexión optimizada para serverless
    client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 1, // Importante para funciones serverless
      compressors: [] // Desactiva módulos problemáticos
    });

    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'whatsapp-business');

    // Verificación de conexión
    await db.command({ ping: 1 });
    console.log('Conexión a MongoDB establecida');

    // Procesamiento del mensaje
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json(
        { error: 'No se encontró mensaje en el payload' },
        { status: 400 }
      );
    }

    // Guardar mensaje con metadatos adicionales
    const result = await db.collection('messages').insertOne({
      ...message,
      direction: 'inbound',
      processedAt: new Date(),
      status: 'received'
    });

    console.log(`Mensaje guardado con ID: ${result.insertedId}`);

    return NextResponse.json({ 
      success: true,
      messageId: result.insertedId 
    });

  } catch (error) {
    console.error('Error en webhook:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    // Cierra la conexión de manera segura
    if (client) {
      setTimeout(async () => {
        try {
          await client.close();
        } catch (e) {
          console.error('Error cerrando conexión:', e);
        }
      }, 1000); // Cierre asíncrono con retardo
    }
  }
}