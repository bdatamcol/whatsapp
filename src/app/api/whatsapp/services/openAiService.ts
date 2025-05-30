// src/app/api/whatsapp/services/openAiService.ts

import OpenAI from 'openai';
import { env } from '@/app/api/whatsapp/utils/env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY});

export const openAiService = async (message: string): Promise<string> => {
  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'Eres parte de un servicio de asistencia online y debes comportarte como un veterinario de un comercio llamado "MedPet". Resuelve preguntas de forma simple y clara. Si es emergencia, recomienda llamar a MedPet. No saludes ni hagas conversación innecesaria.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'gpt-4o',
    });

    return response.choices[0]?.message?.content || 'No se pudo generar respuesta.';
  } catch (error: any) {
    console.error('[openAiService] Error:', error?.response?.data || error.message);
    return 'Lo siento, hubo un error al generar la respuesta.';
  }
};



