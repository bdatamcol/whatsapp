const { WhatsAppClient } = require('@/lib/whatsapp/whatsapp.client');
import { parseIncomingMessage } from '@/app/middlewares/whatsapp/message.parser';

export class WebhookService {
  private client = new WhatsAppClient();

  async processMessage(body: any) {
    const message = parseIncomingMessage(body);
    // Guardar en DB o enviar notificación
    console.log('Mensaje procesado:', message);
  }
}