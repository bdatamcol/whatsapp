import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from './webhook.service';
import { parseIncomingMessage } from '@/app/middlewares/whatsapp/message.parser';
import clientPromise from '@/lib/mongodb';
import { Db } from 'mongodb';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'miverifytoken';

// Helper para logs estructurados
function logEvent(type: string, details: object) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type,
    ...details
  }, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  logEvent('WEBHOOK_VERIFICATION', { mode, token });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logEvent('WEBHOOK_VERIFIED', { status: 'success' });
    return new NextResponse(challenge, { status: 200 });
  }

  logEvent('WEBHOOK_VERIFICATION_FAILED', { error: 'Token inválido' });
  return NextResponse.json(
    { error: 'Token de verificación incorrecto' },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  let db: Db;
  let client;

  try {
    // Conexión con logging
    logEvent('DB_CONNECTION_ATTEMPT', {});
    
    client = await clientPromise;
    db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
    
    logEvent('DB_CONNECTION_SUCCESS', {
      db: db.databaseName,
      collections: await db.listCollections().toArray().then(cols => cols.map(c => c.name))
    });

    const body = await request.json();
    logEvent('WEBHOOK_PAYLOAD_RECEIVED', { body });

    if (body?.object !== "whatsapp_business_account" || !body.entry) {
      logEvent('INVALID_PAYLOAD', { body });
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const service = new WebhookService(db);
    let receivedMessages = false;

    for (const entry of body.entry) {
      if (!entry.changes) continue;

      for (const change of entry.changes) {
        const value = change.value;

        // Procesamiento de mensajes
        if (value.messages?.length > 0) {
          receivedMessages = true;
          const message = value.messages[0];
          
          logEvent('NEW_MESSAGE_RECEIVED', {
            from: message.from,
            type: message.type,
            id: message.id
          });

          try {
            const parsedMessage = parseIncomingMessage(message);
            const result = await db.collection('messages').insertOne({
              ...parsedMessage,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            logEvent('MESSAGE_SAVED', {
              messageId: result.insertedId,
              collection: 'messages'
            });

            await service.processMessage(parsedMessage);
          } catch (error) {
            logEvent('MESSAGE_PROCESSING_ERROR', {
              error: error.message,
              rawMessage: message
            });

            await db.collection('failed_messages').insertOne({
              rawMessage: message,
              error: error.message,
              timestamp: new Date()
            });
          }
        }

        // Procesamiento de estados
        if (value.statuses?.length > 0) {
          const status = value.statuses[0];
          logEvent('MESSAGE_STATUS_UPDATE', {
            id: status.id,
            status: status.status
          });

          if (status.id) {
            try {
              await db.collection('messages').updateOne(
                { id: status.id },
                { $set: { status: status.status } }
              );
            } catch (updateError) {
              logEvent('STATUS_UPDATE_FAILED', {
                error: updateError.message,
                status
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    logEvent('GLOBAL_ERROR', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';