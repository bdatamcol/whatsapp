// src/app/api/whatsapp/contacts/route.ts
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET() {
  let client;
  
  try {

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

    // const contacts = await db.collection('messages')
    //   .aggregate(pipeline)
    //   .toArray();

    return NextResponse.json('contacts');

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