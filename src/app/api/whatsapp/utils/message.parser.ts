/**
 * Normaliza mensajes de WhatsApp a formato interno
 */
import { Message } from '@/types/whatsapp.d';

export interface IncomingMessage extends Omit<Message, 'status'> {
  media?: {
    url: string;
    caption?: string;
  };
}

export function parseIncomingMessage(msg: any): IncomingMessage {
  return {
    id: msg.id,
    from: msg.from,
    text: msg.text?.body || '',
    timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
    direction: 'inbound',
    type: msg.type,
    media: msg.type !== 'text' ? {
      url: msg[msg.type]?.url,
      caption: msg[msg.type]?.caption
    } : undefined
  };
}