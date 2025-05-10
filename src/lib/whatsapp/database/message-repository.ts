// src/lib/whatsapp/database/message-repository.ts
import { MongoClient, Db, Collection } from 'mongodb';
import { Message, DatabaseMessage } from '@/types/whatsapp.d';

// Singleton para la conexión MongoDB
let client: MongoClient;
let db: Db;

/**
 * Conecta a la base de datos MongoDB (solo del lado del servidor)
 * @returns Instancia de Db
 * @throws Error si se intenta usar en el cliente o si falta la URI
 */
async function connectToDatabase(): Promise<Db> {
  // Verificar si estamos en el cliente (navegador)
  if (typeof window !== 'undefined') {
    throw new Error('Las operaciones con MongoDB solo están permitidas en el lado del servidor');
  }

  if (!client) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definido en las variables de entorno');
    }

    client = new MongoClient(process.env.MONGODB_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50, // Limitar conexiones simultáneas
      socketTimeoutMS: 30000,
      waitQueueTimeoutMS: 10000
    });

    try {
      await client.connect();
      db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
      
      // Verificar conexión
      await db.command({ ping: 1 });
      console.log('[MongoDB] Conexión establecida correctamente');
    } catch (error) {
      console.error('[MongoDB] Error al conectar:', error);
      throw new Error('No se pudo conectar a MongoDB');
    }
  }

  return db;
}

/**
 * Obtiene la colección de mensajes con tipado seguro
 */
async function getMessagesCollection(): Promise<Collection<DatabaseMessage>> {
  const db = await connectToDatabase();
  return db.collection<DatabaseMessage>('messages');
}

/**
 * Guarda un mensaje en la base de datos
 * @param message Mensaje a guardar
 * @returns Mensaje guardado con metadatos adicionales
 */
export async function saveMessageToDatabase(message: Message): Promise<DatabaseMessage> {
  const messagesCollection = await getMessagesCollection();
  
  const messageWithTimestamps: DatabaseMessage = {
    ...message,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await messagesCollection.insertOne(messageWithTimestamps);
    return { ...messageWithTimestamps, _id: result.insertedId };
  } catch (error) {
    console.error('[DB] Error al guardar mensaje:', error);
    throw new Error('No se pudo guardar el mensaje');
  }
}

/**
 * Obtiene mensajes para un contacto específico
 * @param contactId ID del contacto
 * @param limit Límite de mensajes a devolver
 * @param before Fecha para paginación (obtener mensajes anteriores a esta fecha)
 * @returns Array de mensajes
 */
export async function getMessagesByContact(
  contactId: string, 
  limit: number = 50, 
  before?: string
): Promise<Message[]> {
  const messagesCollection = await getMessagesCollection();
  const query: any = { 
    $or: [{ from: contactId }, { to: contactId }] 
  };

  if (before) {
    query.timestamp = { $lt: before };
  }

  try {
    const messages = await messagesCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return messages.map(normalizeMessage);
  } catch (error) {
    console.error('[DB] Error al obtener mensajes:', error);
    throw new Error('No se pudieron recuperar los mensajes');
  }
}

/**
 * Obtiene el último mensaje para cada contacto
 * @returns Array de mensajes
 */
export async function getLastMessagesForContacts(): Promise<Message[]> {
  const messagesCollection = await getMessagesCollection();

  const pipeline = [
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$direction", "outbound"] },
            "$to",
            "$from"
          ]
        },
        lastMessage: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$lastMessage" } }
  ];

  try {
    const messages = await messagesCollection
      .aggregate(pipeline)
      .toArray();

    return messages.map(normalizeMessage);
  } catch (error) {
    console.error('[DB] Error al obtener últimos mensajes:', error);
    throw new Error('No se pudieron recuperar los últimos mensajes');
  }
}

/**
 * Normaliza un mensaje de la base de datos
 */
function normalizeMessage(msg: any): Message {
  return {
    id: msg.id,
    from: msg.from,
    to: msg.to,
    text: msg.text || '',
    direction: msg.direction || 'inbound',
    timestamp: msg.timestamp instanceof Date ? 
      msg.timestamp.toISOString() : 
      msg.timestamp || new Date().toISOString(),
    ...(msg.status && { status: msg.status }),
    ...(msg.type && { type: msg.type }),
    ...(msg.media && { media: msg.media }),
    ...(msg.replyTo && { replyTo: msg.replyTo })
  };
}

/**
 * Crea índices para optimizar consultas
 */
export async function createIndexes() {
  if (typeof window !== 'undefined') return;

  try {
    const db = await connectToDatabase();
    await db.collection('messages').createIndexes([
      { key: { from: 1 } },
      { key: { to: 1 } },
      { key: { timestamp: -1 } },
      { 
        key: { from: 1, to: 1, timestamp: -1 },
        name: 'conversation_chronological' 
      },
      {
        key: { text: 'text' },
        name: 'message_text_search',
        weights: { text: 10 }
      }
    ]);
    console.log('[DB] Índices creados correctamente');
  } catch (error) {
    console.error('[DB] Error al crear índices:', error);
  }
}

// Crear índices al iniciar (solo en servidor)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  createIndexes().catch(error => {
    console.error('[DB] Error al crear índices al iniciar:', error);
  });
}

// Manejo de cierre de conexión
if (typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    if (client) {
      await client.close();
      console.log('[MongoDB] Conexión cerrada por SIGINT');
      process.exit(0);
    }
  });

  process.on('SIGTERM', async () => {
    if (client) {
      await client.close();
      console.log('[MongoDB] Conexión cerrada por SIGTERM');
      process.exit(0);
    }
  });
}