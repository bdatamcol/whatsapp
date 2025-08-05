// Sistema de notificaciones para mensajes de Messenger
// Almacén de eventos para Server-Sent Events (SSE)
type MessageEvent = {
  data: any;
  timestamp: number;
};

type Subscriber = {
  id: string;
  controller: ReadableStreamDefaultController;
};

// Almacén de suscriptores para SSE
const subscribers = new Set<Subscriber>();

// Cola de eventos recientes para nuevos suscriptores
const recentEvents: MessageEvent[] = [];
const MAX_RECENT_EVENTS = 10;

/**
 * Notifica a todos los clientes conectados sobre un nuevo mensaje
 */
export function notifyNewMessage(data: any) {
  // Manejar notificaciones temporales de reacciones
  if (data.type === 'reaction_temp' && data.senderId && data.pageId) {
    const notificationData = data;

    // NO guardar en eventos recientes para notificaciones temporales
    // Solo enviar a los suscriptores
    for (const subscriber of subscribers) {
      try {
        subscriber.controller.enqueue(
          `data: ${JSON.stringify(notificationData)}\n\n`
        );
      } catch (error) {
        console.error(`Error enviando notificación temporal a suscriptor ${subscriber.id}:`, error);
      }
    }

    return; // Terminar aquí para notificaciones temporales
  }

  if (data.object === 'page' && data.entry && data.entry.length > 0) {
    const entry = data.entry[0];
    if (entry.changes && entry.changes.length > 0) {
      const change = entry.changes[0];
      if (change.field === 'feed' && change.value && change.value.item === 'reaction') {
        const value = change.value;
        if (value.from && value.from.id) {
          const reactionNotification = {
            type: 'reaction_temp',
            senderId: value.from.id,
            senderName: value.from.name || 'Usuario desconocido',
            pageId: entry.id,
            timestamp: value.created_time || Date.now(),
            item: 'reaction',
            reaction_type: value.reaction_type || 'like',
            verb: value.verb || 'add',
            autoDelete: true,
            deleteAfter: 3000
          };

          for (const subscriber of subscribers) {
            try {
              subscriber.controller.enqueue(
                `data: ${JSON.stringify(reactionNotification)}\n\n`
              );
            } catch (error) {
              console.error(`❌ Error enviando reacción del webhook a suscriptor ${subscriber.id}:`, error);
            }
          }

          return; // Terminar aquí para reacciones del webhook
        }
      }
    }
  }

  // Si ya es un objeto de notificación procesado (desde handleFeedChange), usarlo directamente
  if (data.type === 'feed' && data.senderId && data.pageId) {
    const notificationData = data;

    // Guardar evento en la cola de eventos recientes
    const event: MessageEvent = {
      data: notificationData,
      timestamp: Date.now(),
    };

    recentEvents.push(event);
    if (recentEvents.length > MAX_RECENT_EVENTS) {
      recentEvents.shift(); // Mantener solo los eventos más recientes
    }

    // Enviar solo a los suscriptores
    for (const subscriber of subscribers) {
      try {
        subscriber.controller.enqueue(
          `data: ${JSON.stringify(notificationData)}\n\n`
        );
      } catch (error) {
        console.error(`Error enviando notificación a suscriptor ${subscriber.id}:`, error);
      }
    }

    return; // Terminar aquí si ya es un objeto procesado
  }

  // Extraer información relevante del webhook
  const event: MessageEvent = {
    data,
    timestamp: Date.now(),
  };

  // Guardar evento en la cola de eventos recientes
  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.shift(); // Mantener solo los eventos más recientes
  }

  // Notificar a todos los suscriptores
  for (const subscriber of subscribers) {
    try {
      // Extraer información relevante para la notificación
      let notificationData: any = { type: 'unknown' };

      // Procesar datos según el tipo de webhook
      if (data.object === 'page' && data.entry && data.entry.length > 0) {
        const entry = data.entry[0];

        // Verificar si es un mensaje de feed (comentario)
        if (entry.changes && entry.changes.length > 0 && entry.changes[0].field === 'feed') {
          const change = entry.changes[0].value;
          if (change.from) {
            // Procesar reacciones (likes, etc.) - enviar como notificación temporal
            if (change.item === 'reaction') {
              notificationData = {
                type: 'reaction_temp',
                senderId: change.from.id,
                senderName: change.from.name || 'Usuario desconocido',
                pageId: entry.id,
                timestamp: entry.time || Date.now(),
                item: 'reaction',
                reaction_type: change.reaction_type || 'like',
                verb: change.verb || 'add',
                autoDelete: true,
                deleteAfter: 3000
              };

              // Enviar solo a suscriptores, no guardar en eventos recientes
              subscriber.controller.enqueue(
                `data: ${JSON.stringify(notificationData)}\n\n`
              );
              continue; // Continuar con el siguiente suscriptor
            }

            notificationData = {
              type: 'feed',
              senderId: change.from.id,
              senderName: change.from.name || 'Usuario desconocido',
              pageId: entry.id,
              timestamp: entry.time || Date.now(),
              item: change.item || 'post',
              verb: change.verb || 'unknown'
            };
          }
        }

        // Verificar si es un mensaje directo
        if (entry.messaging && entry.messaging.length > 0) {
          const messaging = entry.messaging[0];
          if (messaging.sender && messaging.message) {
            notificationData = {
              type: 'message',
              senderId: messaging.sender.id,
              senderName: messaging.sender.name || 'Usuario desconocido',
              pageId: entry.id,
              timestamp: messaging.timestamp || Date.now(),
              text: messaging.message.text || ''
            };
          }
        }
      }

      // Enviar la notificación al cliente
      subscriber.controller.enqueue(
        `data: ${JSON.stringify(notificationData)}\n\n`
      );
    } catch (error) {
      console.error(`Error enviando notificación a suscriptor ${subscriber.id}:`, error);
      // No eliminar el suscriptor aquí, se manejará cuando la conexión se cierre
    }
  }
}

/**
 * Crea un nuevo stream para Server-Sent Events
 */
export function createNotificationStream(): ReadableStream {
  const subscriberId = Date.now().toString();

  return new ReadableStream({
    start(controller) {
      // Registrar nuevo suscriptor
      subscribers.add({ id: subscriberId, controller });

      // Enviar eventos recientes al nuevo suscriptor
      for (const event of recentEvents) {
        controller.enqueue(`data: ${JSON.stringify(event.data)}\n\n`);
      }

      // Enviar un evento inicial para confirmar conexión
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
    },
    cancel() {
      // Eliminar suscriptor cuando se cierra la conexión
      for (const subscriber of subscribers) {
        if (subscriber.id === subscriberId) {
          subscribers.delete(subscriber);
          break;
        }
      }
    }
  });
}