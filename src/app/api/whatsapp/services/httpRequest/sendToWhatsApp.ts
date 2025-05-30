// src/app/api/whatsapp/services/httpRequest/sendToWhatsApp.ts

import axios from 'axios';
import { env } from '@/app/api/whatsapp/utils/env';

const BASE_URL = `https://graph.facebook.com/${env.API_VERSION}/${env.BUSINESS_PHONE}/messages`;

export const sendToWhatsApp = async (data: any) => {
  try {
    const headers = {
      Authorization: `Bearer ${env.API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    const response = await axios.post(BASE_URL, data, { headers });
    return response.data;
  } catch (error: any) {
    console.error('[sendToWhatsApp] Error al enviar:', error?.response?.data || error.message);
    throw error;
  }
};