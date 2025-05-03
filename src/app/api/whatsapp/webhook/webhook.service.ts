// src/app/api/whatsapp/webhook/webhook.service.ts
import WhatsAppClient from '@/lib/whatsapp/whatsapp.client';
import { parseIncomingMessage } from '@/app/middlewares/whatsapp/message.parser';
import { saveMessageToDatabase } from '@/lib/database/message-repository';
import { IncomingMessage } from '@/types/whatsapp.d';

export class WebhookService {
  private client = new WhatsAppClient();

  async processMessage(rawMessage: any) {
    try {
      console.log('[WEBHOOK] Procesando mensaje:', rawMessage?.id);

      // Usa tu parser existente
      const message = parseIncomingMessage(rawMessage);

      if (!message.from || !message.text) {
        console.error('Mensaje inválido:', rawMessage);
        return;
      }

      // Guardar en DB (implementación mockeada)
      await saveMessageToDatabase(message);

      // Respuesta mejorada
      const responseText = this.generateResponse(message.text);
      await this.client.sendText(message.from, responseText);

      return { success: true };

    } catch (error) {
      console.error('Error en processMessage:', error);
      throw error;
    }
  }

  private generateResponse(inputText: string): string {
    const text = inputText.toLowerCase();
    
    if (text.includes('hola')) return '¡Hola! ¿En qué puedo ayudarte?';
    if (text.includes('gracias')) return '¡Es un placer ayudarte! 😊';
    
    return 'Hemos recibido tu mensaje. Te responderemos pronto.';
  }
}