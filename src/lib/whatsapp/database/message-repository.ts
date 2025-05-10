// src/lib/whatsapp/database/message-repository.ts
import { connectToDatabase } from './mongodb';
import { ensureServerOnly } from '@/lib/server-only';
import type { Message, DatabaseMessage } from '@/types/whatsapp.d';

ensureServerOnly();

export async function getMessagesByContact(
  contactId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  const { db } = await connectToDatabase();
  
  const query: any = {
    $or: [{ from: contactId }, { to: contactId }]
  };

  if (before) {
    query.timestamp = { $lt: before }; // Usar directamente el string ISO sin convertirlo a Date
  }

  const messages = await db.collection<DatabaseMessage>('messages')
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return messages.map(msg => ({
    ...msg,
    _id: msg._id.toString(),
    // Asegurar que timestamp sea string (ya debería serlo según tus tipos)
    timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString()
  }));
}

export async function getLastMessagesForContacts(): Promise<Message[]> {
  const { db } = await connectToDatabase();
  
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
    { $replaceRoot: { newRoot: "$lastMessage" } },
    {
      $project: {
        _id: 0, // Excluir _id original
        id: { $toString: "$_id" }, // Convertir _id a string como id
        from: 1,
        to: 1,
        text: 1,
        direction: 1,
        timestamp: {
          $cond: {
            if: { $eq: [{ $type: "$timestamp" }, "string"] },
            then: "$timestamp",
            else: { $dateToString: { date: "$timestamp", format: "%Y-%m-%dT%H:%M:%S.%LZ" } }
          }
        },
        status: 1,
        type: 1,
        media: 1,
        replyTo: 1
      }
    }
  ];

  return await db.collection<DatabaseMessage>('messages')
    .aggregate<Message>(pipeline) // Especificar tipo de retorno
    .toArray();
}

export async function saveMessageToDatabase(message: Message): Promise<DatabaseMessage> {
  const { db } = await connectToDatabase();

  const messageWithTimestamps: DatabaseMessage = {
    ...message,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<DatabaseMessage>('messages')
    .insertOne(messageWithTimestamps);

  return {
    ...messageWithTimestamps,
    _id: result.insertedId,
    timestamp: typeof message.timestamp === 'string' ? 
      message.timestamp : 
      message.timestamp.toISOString()
  };
}