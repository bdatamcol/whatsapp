// src/lib/whatsapp/database/message-repository.ts
import { MongoClient, Db, Collection } from 'mongodb';
import { Message, DatabaseMessage, Contact } from '@/types/whatsapp.d';

let client: MongoClient;
let db: Db;

async function connectToDatabase(): Promise<Db> {
  if (!client) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definido en las variables de entorno');
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
  }
  return db;
}

export async function saveMessageToDatabase(message: Message): Promise<DatabaseMessage> {
  try {
    const db = await connectToDatabase();
    const messagesCollection = db.collection<DatabaseMessage>('messages');
    
    const messageWithTimestamps: DatabaseMessage = {
      ...message,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await messagesCollection.insertOne(messageWithTimestamps);
    console.log(`[DB] Mensaje guardado con ID: ${result.insertedId}`);
    return { ...messageWithTimestamps, _id: result.insertedId };
  } catch (error) {
    console.error('[DB] Error al guardar mensaje:', error);
    throw error;
  }
}

// src/lib/whatsapp/database/message-repository.ts
export async function getMessagesByContact(contactId: string, limit = 50, before?: string): Promise<Message[]> {
  try {
    const db = await connectToDatabase();
    const query: any = { 
      $or: [{ from: contactId }, { to: contactId }] 
    };

    if (before) {
      query.timestamp = { $lt: before };
    }

    const messages = await db.collection<Message>('messages')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return messages.map(msg => {
      const timestamp = msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp;
      return {
        ...msg,
        timestamp,
        // Asegurarse de incluir todas las propiedades requeridas por Message
        id: msg.id,
        text: msg.text,
        direction: msg.direction,
        // Incluir propiedades opcionales si existen
        ...(msg.status && { status: msg.status }),
        ...(msg.type && { type: msg.type }),
        ...(msg.media && { media: msg.media })
      };
    });
  } catch (error) {
    console.error('[DB] Error al obtener mensajes:', error);
    throw error;
  }
}

export async function createIndexes() {
  try {
    const db = await connectToDatabase();
    await db.collection('messages').createIndex({ from: 1 });
    await db.collection('messages').createIndex({ to: 1 });
    await db.collection('messages').createIndex({ timestamp: -1 });
    await db.collection('messages').createIndex({ 
      from: 1, 
      to: 1, 
      timestamp: -1 
    });
    console.log('[DB] Índices creados correctamente');
  } catch (error) {
    console.error('[DB] Error al crear índices:', error);
  }
}

// Crear índices al iniciar (opcional)
if (process.env.NODE_ENV !== 'test') {
  createIndexes().catch(console.error);
}