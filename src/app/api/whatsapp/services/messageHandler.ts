// src/app/api/whatsapp/services/messageHandler.ts

import { Db } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { openAiService } from './openAiService';
import { whatsappService } from './whatsappService';

export class WebhookService {
  private db: Db;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    const client = await clientPromise;
    this.db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
  }

  async processMessage(rawMessage: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('[WEBHOOK] Procesando mensaje:', rawMessage?.id);

      const message = this.parseMessage(rawMessage);
      if (!message.from || !message.text) {
        console.error('[WEBHOOK] Mensaje inválido:', rawMessage);
        return { success: false, error: 'Mensaje inválido' };
      }

      const messageToSave = {
        ...message,
        createdAt: new Date(),
        updatedAt: new Date(),
        processed: false
      };

      const result = await this.db.collection('messages').insertOne(messageToSave);
      const messageId = result.insertedId.toString();
      console.log('[WEBHOOK] Mensaje guardado en DB:', messageId);

      await this.db.collection('messages').updateOne(
        { _id: result.insertedId },
        { $set: { processed: true } }
      );

      if (message.direction === 'inbound') {
        try {
          const responseText = await openAiService(message.text);
          await whatsappService.sendMessage(message.from, responseText, message.id);

          await this.db.collection('message_responses').insertOne({
            originalMessageId: messageId,
            responseText,
            sentAt: new Date(),
            status: 'sent'
          });
        } catch (sendError: any) {
          console.error('[WEBHOOK] Error enviando respuesta:', sendError);
          await this.db.collection('message_errors').insertOne({
            messageId,
            error: sendError.message,
            timestamp: new Date(),
            type: 'response_failed'
          });
        }
      }

      return { success: true, messageId };
    } catch (error: any) {
      console.error('[WEBHOOK] Error en processMessage:', error);
      await this.db.collection('message_errors').insertOne({
        rawMessage: JSON.stringify(rawMessage),
        error: error.message,
        timestamp: new Date(),
        type: 'processing_error'
      });
      return { success: false, error: error.message };
    }
  }

  private parseMessage(raw: any) {
    const value = raw;
    const msg = value;

    const from = msg.from || msg.from_number || '';
    const id = msg.id || '';
    const text = msg.text?.body || '';
    const direction = 'inbound';

    return {
      id,
      from,
      text,
      direction
    };
  }
}