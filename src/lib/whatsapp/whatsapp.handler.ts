import { WebhookService } from '@/app/api/whatsapp/webhook/webhook.service';
import { getMongoClient } from '@/lib/mongo'; // Asumiendo que tienes esta función

export async function handleWebhookEvent(payload: any) {
  console.log('[WEBHOOK] Iniciando procesamiento');

  if (!payload || payload.object !== 'whatsapp_business_account') {
    console.error('[WEBHOOK] Payload inválido');
    return;
  }

  try {
    const mongo = await getMongoClient(); // 🔧 obtener cliente MongoDB
    const db = mongo.db(); // o mongo.db('mi_base_de_datos')

    const service = new WebhookService(db); // ✅ corregido: se pasa el db

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
