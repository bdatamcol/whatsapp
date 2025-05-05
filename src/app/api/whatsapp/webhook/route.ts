// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/app/api/whatsapp/webhook/webhook.service';
import { saveMessageToDatabase } from '@/lib/whatsapp/database/message-repository';
import { parseIncomingMessage } from '@/app/middlewares/whatsapp/message.parser';

const messageStore: Map<string, any> = new Map();
const statusStore: Map<string, any> = new Map();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'miverifytoken';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado correctamente.');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('Error en verificación del webhook:', { mode, token });
  return NextResponse.json({ error: 'Token de verificación incorrecto' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.object !== "whatsapp_business_account" || !body.entry) {
      console.error("[WEBHOOK] Payload inválido:", body);
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const service = new WebhookService();
    let receivedMessages = false;

    for (const entry of body.entry) {
      if (!entry.changes) continue;

      for (const change of entry.changes) {
        const value = change.value;

        if (value.messages?.length > 0) {
          receivedMessages = true;
          const message = value.messages[0];
          console.log(`[WEBHOOK] Nuevo mensaje de ${message.from}`, {
            type: message.type,
            id: message.id
          });

          try {
            const parsedMessage = parseIncomingMessage(message);
            await saveMessageToDatabase(parsedMessage);
            messageStore.set(message.id, parsedMessage);

            await service.processMessage(message);
          } catch (error) {
            console.error("[WEBHOOK] Error procesando mensaje:", error);
          }
        }

        if (value.statuses?.length > 0) {
          const status = value.statuses[0];
          console.log(`[WEBHOOK] Estado actualizado (${status.status})`, {
            id: status.id,
            timestamp: status.timestamp
          });

          statusStore.set(status.id, status);

          if (messageStore.has(status.id)) {
            const message = messageStore.get(status.id);
            messageStore.set(status.id, { ...message, status: status.status });
          }

          if (status.status === 'failed') {
            console.error("[WEBHOOK] Error en entrega:", {
              id: status.id,
              errors: status.errors
            });
          }
        }
      }
    }

    if (!receivedMessages) {
      console.log("[WEBHOOK] Payload recibido sin mensajes nuevos", {
        entry: body.entry.map((e: any) => e.id)
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WEBHOOK] Error en el procesamiento principal:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
