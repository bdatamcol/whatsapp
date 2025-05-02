'use strict';

import { Contact } from "@/types/whatsapp";

const API_VERSION = 'v19.0';

export default class WhatsAppClient {
  private readonly baseUrl: string;

  constructor() {
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID in environment');
    }
    this.baseUrl = `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
  }

  // src/lib/whatsapp/whatsapp.client.ts
async getContacts(): Promise<Contact[]> {
  try {
    // En producción, aquí llamarías a la API de WhatsApp/Meta
    // Pero para desarrollo, podemos simular datos o conectar a una DB
    const mockContacts: Contact[] = [
      {
        id: "521234567890",
        name: "Cliente Ejemplo",
        lastMessage: "Hola, ¿cómo estás?",
        unread: 2,
        lastMessageTime: new Date()
      }
    ];
    return mockContacts;
    
    // Para conexión real con WhatsApp API (descomentar cuando esté listo):
    // const response = await fetch(`${this.baseUrl}/contacts`, {
    //   headers: this.getHeaders()
    // });
    // return await this.handleResponse(response);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

  async sendText(to: string, message: string) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        text: { body: message }
      }),
    });
    return this.handleResponse(response);
  }

  private getHeaders() {
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      throw new Error('Missing WHATSAPP_ACCESS_TOKEN in environment');
    }
    return {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API Error:', error);
      throw new Error(error.error?.message || 'WhatsApp API error');
    }
    return response.json();
  }
}
// 🔥 Nada más después de aquí. ¡No más module.exports!
