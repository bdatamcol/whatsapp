// src/lib/database/message-repository.ts
import { MongoClient } from 'mongodb';
import { DatabaseMessage } from '@/types/whatsapp.d';

// Conexión a MongoDB (usa tus variables de entorno)
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'whatsapp-business';

let client: MongoClient;
let isConnected = false;

async function connectToDatabase() {
  if (!isConnected) {
    client = new MongoClient(uri);
    await client.connect();
    isConnected = true;
  }
  return client.db(dbName);
}

// src/lib/database/message-repository.ts
import { Message } from '@/types/whatsapp.d';

// Mock temporal (implementa conexión real según tu DB)
export async function saveMessageToDatabase(message: Message) {
  console.log('[DB] Guardando mensaje:', message.id);
  // await yourDatabaseClient.insert(message);
  return { success: true }; // Simulación
}

export async function getMessagesByContact(contactId: string, limit = 50) {
  try {
    const db = await connectToDatabase();
    return await db.collection('messages')
      .find({ $or: [{ from: contactId }, { to: contactId }] })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
}