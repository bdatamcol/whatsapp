/**
 * Genera payloads para enviar mensajes estructurados
 */
import { Message } from '@/types/whatsapp.d';

interface WhatsAppApiMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  text?: { body: string };
  type?: string;
  interactive?: any;
}

export function generateTextPayload(to: string, text: string): WhatsAppApiMessage {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    text: { body: text }
  };
}

export function generateButtonPayload(to: string, text: string, buttons: string[]): WhatsAppApiMessage {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: {
        buttons: buttons.map((btn, i) => ({
          type: "reply",
          reply: { id: `btn_${i}`, title: btn }
        }))
      }
    }
  };
}