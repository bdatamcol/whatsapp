// Tipos base para WhatsApp
export interface Contact {
  id: string;
  name: string;
  lastMessage?: string;
  unread?: number;
  avatar?: string;
  lastMessageTime?: Date | string;
  isOnline?: boolean;
  status?: string; // Estado del usuario (ej. "disponible", "ocupado")
}

export interface Message {
  id: string;
  from?: string;
  to?: string;
  text: string;
  timestamp: string | Date;
  direction: 'inbound' | 'outbound';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  type?: 'text' | 'image' | 'video' | 'document' | 'audio' | 'location' | 'contact';
  media?: {
    url: string;
    caption?: string;
    mimeType?: string;
    fileSize?: number;
  };
  replyTo?: string; // ID del mensaje al que se responde
}

// Tipos para mensajes entrantes del webhook
export interface IncomingMessage extends Omit<Message, 'status'> {
  media?: {
    url: string;
    caption?: string;
  };
}

// Tipos para la API de WhatsApp
export interface WhatsAppApiMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  text?: { body: string };
  type?: string;
  interactive?: any;
  template?: any;
}

// Tipos para payloads de mensajes
export interface TextMessagePayload extends WhatsAppApiMessage {
  text: { body: string };
}

export interface MediaMessagePayload extends WhatsAppApiMessage {
  type: 'image' | 'video' | 'document' | 'audio';
  [key: string]: any; // Para las propiedades específicas de cada tipo de media
}

export interface ButtonMessagePayload extends WhatsAppApiMessage {
  type: "interactive";
  interactive: {
    type: "button";
    body: { text: string };
    action: {
      buttons: Array<{
        type: "reply";
        reply: { id: string; title: string };
      }>;
    };
  };
}

// Tipos para el estado de la conversación
export interface Conversation {
  contact: Contact;
  messages: Message[];
  unreadCount: number;
  isTyping?: boolean;
  lastSeen?: Date | string;
}

// Tipos para eventos del webhook
export interface WebhookEvent {
  object: 'whatsapp_business_account';
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Contact[];
    messages?: Message[];
    statuses?: MessageStatus[];
  };
  field: string;
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}