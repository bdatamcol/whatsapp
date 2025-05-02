import { WebhookService } from '@/app/api/whatsapp/webhook/webhook.service';
const { WhatsAppClient } = require('@/lib/whatsapp/whatsapp.client');
/**
 * Procesa eventos entrantes del webhook de WhatsApp
 * Documentación oficial: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */
export async function handleWebhookEvent(payload: any) {
  const service = new WebhookService();
  const client = new WhatsAppClient();

  // Verificar si es un mensaje válido
  if (payload.object !== 'whatsapp_business_account') return;

  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message) {
    await service.processMessage(message);
    
    // Auto-respuesta ejemplo (opcional)
    if (message.type === 'text') {
      await client.sendText(
        message.from, 
        `Recibimos tu mensaje: "${message.text?.body}"`
      );
    }
  }
}