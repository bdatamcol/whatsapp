// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { WebhookService } from '@/app/api/whatsapp/webhook/webhook.service';
import { saveMessageToDatabase } from '@/lib/whatsapp/database/message-repository';
import { parseIncomingMessage } from '@/app/middlewares/whatsapp/message.parser';

// Almacenamiento mejorado en memoria
const messageStore: Map<string, any> = new Map();
const statusStore: Map<string, any> = new Map();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Verificación del webhook
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "miverifytoken";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verificado correctamente.");
      return res.status(200).send(challenge);
    }
    console.error("Error en verificación del webhook:", { mode, token });
    return res.status(403).json({ error: "Token de verificación incorrecto" });
  }

  if (req.method === "POST") {
    console.log("[WEBHOOK] Iniciando procesamiento");
    
    try {
      const body = req.body;
      
      // Validación básica del payload
      if (body?.object !== "whatsapp_business_account" || !body.entry) {
        console.error("[WEBHOOK] Payload inválido:", body);
        return res.status(400).json({ error: "Payload inválido" });
      }

      const service = new WebhookService();
      let receivedMessages = false;

      for (const entry of body.entry) {
        if (!entry.changes) continue;

        for (const change of entry.changes) {
          const value = change.value;
          
          // 1. Manejar mensajes entrantes
          if (value.messages?.length > 0) {
            receivedMessages = true;
            const message = value.messages[0];
            console.log(`[WEBHOOK] Nuevo mensaje de ${message.from}`, {
              type: message.type,
              id: message.id
            });

            try {
              // Procesar y guardar el mensaje
              const parsedMessage = parseIncomingMessage(message);
              await saveMessageToDatabase(parsedMessage);
              messageStore.set(message.id, parsedMessage);
              
              // Procesar con el servicio (respuestas automáticas)
              await service.processMessage(message);
            } catch (error) {
              console.error("[WEBHOOK] Error procesando mensaje:", error);
            }
          }
          
          // 2. Manejar actualizaciones de estado
          if (value.statuses?.length > 0) {
            const status = value.statuses[0];
            console.log(`[WEBHOOK] Estado actualizado (${status.status})`, {
              id: status.id,
              timestamp: status.timestamp
            });

            statusStore.set(status.id, status);
            
            // Actualizar mensaje correspondiente si existe
            if (messageStore.has(status.id)) {
              const message = messageStore.get(status.id);
              messageStore.set(status.id, { ...message, status: status.status });
            }

            // Manejar errores específicos
            if (status.status === 'failed') {
              console.error("[WEBHOOK] Error en entrega:", {
                id: status.id,
                errors: status.errors
              });
            }
          }
        }
      }

      if (!receivedMessages) {
        console.log("[WEBHOOK] Payload recibido sin mensajes nuevos", {
          entry: body.entry.map((e: any) => e.id)
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[WEBHOOK] Error en el procesamiento principal:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Método no permitido
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}

// Funciones para desarrollo
export const debugGetMessages = () => Array.from(messageStore.values());
export const debugGetStatuses = () => Array.from(statusStore.values());