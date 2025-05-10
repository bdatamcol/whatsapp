// src/app/api/whatsapp/services/whatsappService.ts

import axios from 'axios';
import { env } from '@/app/api/utils/env';

const BASE_URL = `https://graph.facebook.com/${env.API_VERSION}/${env.BUSINESS_PHONE}/messages`;
const HEADERS = {
  Authorization: `Bearer ${env.API_TOKEN}`,
  'Content-Type': 'application/json',
};

class WhatsAppService {
  async sendMessage(to: string, body: string, messageId?: string) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      text: { body },
    };

    if (messageId) {
      data['context'] = { message_id: messageId };
    }

    await this._postToWhatsApp(data);
  }

  async sendInteractiveButtons(to: string, bodyText: string, buttons: any[]) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons },
      },
    };

    await this._postToWhatsApp(data);
  }

  async sendMediaMessage(to: string, type: 'image' | 'audio' | 'video' | 'document', mediaUrl: string, caption?: string) {
    const mediaObject: any = {};

    switch (type) {
      case 'image':
        mediaObject.image = { link: mediaUrl, caption };
        break;
      case 'audio':
        mediaObject.audio = { link: mediaUrl };
        break;
      case 'video':
        mediaObject.video = { link: mediaUrl, caption };
        break;
      case 'document':
        mediaObject.document = { link: mediaUrl, caption, filename: 'file.pdf' };
        break;
      default:
        throw new Error('Tipo de media no soportado');
    }

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type,
      ...mediaObject,
    };

    await this._postToWhatsApp(data);
  }

  async markAsRead(messageId: string) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    await this._postToWhatsApp(data);
  }

  async sendContactMessage(to: string, contact: any) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'contacts',
      contacts: [contact],
    };

    await this._postToWhatsApp(data);
  }

  async sendLocationMessage(to: string, latitude: number, longitude: number, name: string, address: string) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'location',
      location: { latitude, longitude, name, address },
    };

    await this._postToWhatsApp(data);
  }

  private async _postToWhatsApp(data: any) {
    try {
      const response = await axios.post(BASE_URL, data, { headers: HEADERS });
      return response.data;
    } catch (error: any) {
      console.error('[WhatsAppService] Error al enviar mensaje:', error?.response?.data || error.message);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
