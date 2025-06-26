// src/app/api/whatsapp/messages/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import type { Message } from '@/types/whatsapp.d';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is not defined');

const client = new MongoClient(uri);
const dbName = process.env.MONGODB_DB || 'whatsapp-business';

export const dynamic = 'force-dynamic';

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const contactId = searchParams.get('contact');
//   const before = searchParams.get('before');

//   if (!contactId) {
//     return NextResponse.json(
//       { error: 'Se requiere el parámetro contact' },
//       { status: 400 }
//     );
//   }

//   let clientInstance;

//   try {
//     clientInstance = await client.connect();
//     const db = clientInstance.db(dbName);

//     const query: any = {
//       $or: [{ from: contactId }, { to: contactId }]
//     };

//     if (before) {
//       query.timestamp = { $lt: before };
//     }

//     const messages = await db.collection('messages')
//       .find(query)
//       .sort({ timestamp: -1 })
//       .limit(50)
//       .map(msg => ({
//         ...msg,
//         id: msg._id.toString(),
//         timestamp: msg.timestamp.toISOString()
//       }))
//       .toArray();
//     return NextResponse.json(messages);

//   } catch (error) {
//     console.error('Error en GET /api/whatsapp/messages:', error);
//     return NextResponse.json(
//       { error: 'Error al obtener mensajes' },
//       { status: 500 }
//     );
//   } finally {
//     if (clientInstance) await clientInstance.close();
//   }
// }

export async function GET() {
  let clientInstance;
  try {
    clientInstance = await client.connect();
    const db = clientInstance.db(dbName);

    // Suponiendo que "from" es tu propio número y "to" es el contacto, o viceversa
    // El "contactId" será el número del otro participante diferente a ti
    // Reemplaza "YOUR_NUMBER" por tu número real si lo conoces
    const YOUR_NUMBER = "573186295047"; // cambia esto por tu número real

    const contacts = await db.collection('messages').aggregate([
      {
        $project: {
          contactId: {
            $cond: [
              { $eq: ['$from', YOUR_NUMBER] },
              '$to',
              '$from'
            ]
          },
          direction: 1,
          text: 1,
          timestamp: 1,
          name: 1,
          avatar: 1
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$contactId',
          lastMessage: { $first: '$text' },
          lastMessageTime: { $first: '$timestamp' },
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]).toArray();

    // Los contactos tendrán la forma:
    // [{
    //   _id: '593999333444',
    //   lastMessage: '¡Hola, cómo estás?',
    //   lastMessageTime: '2025-06-25T20:00:00.000Z',
    //   name: 'Juan Perez',
    //   avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    //   count: 3
    // }, ...]

    // Opcional: cambia _id a id para el frontend
    const contactsMapped = contacts.map(c => ({
      id: c._id,
      lastMessage: c.lastMessage,
      lastMessageTime: c.lastMessageTime,
      name: c.name,
      avatar: c.avatar,
      count: c.count
    }));
    console.log(contactsMapped);

    return NextResponse.json(contactsMapped);
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    return NextResponse.json({ error: 'Error al obtener contactos' }, { status: 500 });
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