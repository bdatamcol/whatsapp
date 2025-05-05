// src/app/api/whatsapp/webhook/webhook.service.ts
import WhatsAppClient from '@/lib/whatsapp/whatsapp.client';
import { parseIncomingMessage } from '@/app/middlewares/whatsapp/message.parser';
import { Db } from 'mongodb';
import { IncomingMessage } from '@/types/whatsapp.d';

export class WebhookService {
  private client = new WhatsAppClient();
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async processMessage(rawMessage: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('[WEBHOOK] Procesando mensaje:', rawMessage?.id);
      
      // Parsear el mensaje entrante
      const message = parseIncomingMessage(rawMessage);
      if (!message.from || !message.text) {
        console.error('Mensaje inválido:', rawMessage);
        return { success: false, error: 'Mensaje inválido' };
      }

      // Guardar en MongoDB usando la conexión inyectada
      const messageToSave = {
        ...message,
        createdAt: new Date(),
        updatedAt: new Date(),
        processed: false // Marcar como no procesado inicialmente
      };

      const result = await this.db.collection('messages').insertOne(messageToSave);
      const messageId = result.insertedId.toString();
      console.log('[WEBHOOK] Mensaje guardado en DB:', messageId);

      // Marcar como procesado después de guardar
      await this.db.collection('messages').updateOne(
        { _id: result.insertedId },
        { $set: { processed: true } }
      );

      // Generar respuesta automática si es mensaje entrante
      if (message.direction === 'inbound') {
        try {
          const responseText = this.generateResponse(message.text);
          await this.client.sendText(message.from, responseText);
          
          // Registrar la respuesta enviada
          await this.db.collection('message_responses').insertOne({
            originalMessageId: messageId,
            responseText,
            sentAt: new Date(),
            status: 'sent'
          });
        } catch (sendError) {
          console.error('[WEBHOOK] Error enviando respuesta:', sendError);
          await this.db.collection('message_errors').insertOne({
            messageId,
            error: sendError.message,
            timestamp: new Date(),
            type: 'response_failed'
          });
        }
      }

      return { 
        success: true, 
        messageId 
      };
    } catch (error) {
      console.error('Error en processMessage:', error);
      
      // Registrar error en la base de datos
      if (this.db) {
        await this.db.collection('message_errors').insertOne({
          rawMessage: JSON.stringify(rawMessage),
          error: error.message,
          timestamp: new Date(),
          type: 'processing_error'
        });
      }

      throw error;
    }
  }

  private generateResponse(inputText: string): string {
    const text = inputText.toLowerCase().trim();
    
    // Respuestas automatizadas
    if (/hola|buenos\s*d[ií]as|buenas\s*tardes/i.test(text)) {
      return '¡Hola! ¿En qué puedo ayudarte hoy?';
    }
    
    if (/gracias|agradecido|agradecimiento/i.test(text)) {
      return '¡Es un placer ayudarte! 😊 ¿Necesitas algo más?';
    }
    
    if (/precio|cost[eo]|valor/i.test(text)) {
      return 'Para información de precios, por favor indícanos qué producto o servicio te interesa.';
    }
    
    if (/horario|atenci[oó]n|abierto/i.test(text)) {
      return 'Nuestro horario de atención es de lunes a viernes de 9am a 6pm.';
    }
    
    // Respuesta por defecto
    return 'Hemos recibido tu mensaje. Uno de nuestros agentes te responderá pronto.';
  }
}