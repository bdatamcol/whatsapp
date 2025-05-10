// src/app/api/whatsapp/contacts/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Configuración de conexión directa (solo para rutas API)
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is not defined');

const client = new MongoClient(uri);
const dbName = process.env.MONGODB_DB || 'whatsapp-business';

export const dynamic = 'force-dynamic';

export async function GET() {
  let client;
  
  try {
    client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    // Pipeline optimizado para obtener últimos mensajes
    const pipeline = [
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$direction", "outbound"] },
              "$to",
              "$from"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$lastMessage",
              { unreadCount: "$count" }
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          lastMessage: "$text",
          lastMessageTime: "$timestamp",
          unread: "$unreadCount",
          avatar: 1,
          isOnline: 1
        }
      }
    ];

    const contacts = await db.collection('messages')
      .aggregate(pipeline)
      .toArray();

    return NextResponse.json(contacts);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}