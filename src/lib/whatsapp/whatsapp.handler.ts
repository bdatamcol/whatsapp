import { WebhookService } from '@/app/api/whatsapp/webhook/webhook.service';

export async function handleWebhookEvent(payload: any) {
  const service = new WebhookService();
  console.log('[WEBHOOK] Iniciando procesamiento');

  // 1. Validación básica del payload
  if (!payload || payload.object !== 'whatsapp_business_account') {
    console.error('[WEBHOOK] Payload inválido');
    return;
  }

  try {
    const service = new WebhookService();
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      console.log('[WEBHOOK] Mensaje detectado:', message.type);
      await service.processMessage(message);
    } else {
      console.log('[WEBHOOK] Evento sin mensaje:', changes?.value);
    }
  } catch (error) {
    console.error('[WEBHOOK] Error procesando mensaje:', error);
    throw error;
  }
}

