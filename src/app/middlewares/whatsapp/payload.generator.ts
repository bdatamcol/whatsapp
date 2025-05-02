/**
 * Genera payloads para enviar mensajes estructurados
 * Ejemplo: botones, listas, templates
 */
import { Message } from '@/types/whatsapp.d';


export function generateTextPayload(to: string, text: string): Message {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    text: { body: text }
  };
}

export function generateButtonPayload(to: string, text: string, buttons: string[]) {
  return {
    messaging_product: "whatsapp",
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