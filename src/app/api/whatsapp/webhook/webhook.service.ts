import WhatsAppClient  from '@/lib/whatsapp/whatsapp.client'; // 👈 Ruta correcta
export class WebhookService {
  private client = new WhatsAppClient();

  async processMessage(message: any) {
    try {
      console.log('[WEBHOOK] Procesando mensaje:', message?.id);

      if (!message?.from || message.type !== 'text' || !message.text?.body) {
        console.error('Mensaje inválido o no es texto:', message);
        return;
      }

      // Opcional: Guardar en base de datos
      // await saveToDatabase(message);

      // Auto-respuesta
      await this.client.sendText(
        message.from, 
        `Recibimos: "${message.text.body}"`
      );
    } catch (error) {
      console.error('Error en processMessage:', error);
      throw error; // Opcional: Propagar el error si es crítico
    }
  }
}