import { NextRequest, NextResponse } from 'next/server';
import { MessengerAccountsService } from '@/lib/messenger/accounts';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId es requerido' },
        { status: 400 }
      );
    }

    // Obtener el token de acceso para la página
    const accessToken = MessengerAccountsService.getPageAccessToken(pageId);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No se encontró token de acceso para esta página' },
        { status: 404 }
      );
    }

    // NO limpiar mensajes existentes para evitar pérdida de datos
    // MessengerAccountsService.clearPageMessages(pageId);

    // Obtener conversaciones desde la API de Facebook con límite optimizado
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    const conversationsResponse = await fetch(
      `https://graph.facebook.com/${process.env.META_API_VERSION}/${pageId}/conversations?fields=id,participants,messages.limit(50){message,from,to,created_time,id,sticker,attachments}&limit=25&access_token=${accessToken}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!conversationsResponse.ok) {
      const errorData = await conversationsResponse.json();
      return NextResponse.json(
        { error: `Error de Facebook: ${errorData.error?.message || 'Error desconocido'}` },
        { status: 400 }
      );
    }

    const conversationsData = await conversationsResponse.json();
    let totalMessagesSynced = 0;

    // Iniciando sincronización

    // Obtener también mensajes enviados por la página directamente
    let sentMessages = [];
    try {
      const sentMessagesResponse = await fetch(
        `https://graph.facebook.com/${process.env.META_API_VERSION}/${pageId}/messages?fields=message,from,to,created_time,id,sticker,attachments&limit=100&access_token=${accessToken}`
      );
      if (sentMessagesResponse.ok) {
        const sentMessagesData = await sentMessagesResponse.json();
        sentMessages = sentMessagesData.data || [];
        // Mensajes enviados encontrados
      }
    } catch (error) {
      // Error obteniendo mensajes enviados
    }

    // Procesar cada conversación
    const conversations = conversationsData.data || [];
    // Conversaciones encontradas

    let processedConversations = 0;

    // Crear un conjunto de IDs de mensajes existentes para verificación rápida de duplicados
    const existingMessageIds = new Set();
    try {
      const allExistingMessages = MessengerAccountsService.getAllMessages(pageId);
      allExistingMessages.forEach(msg => existingMessageIds.add(msg.id));
      // Mensajes existentes cargados
    } catch (error) {
      // Error obteniendo mensajes existentes
    }

    for (const conversation of conversations) {
      try {
        // Obtener mensajes de la conversación inicial
        let messages = conversation.messages?.data || [];

        // Si no hay mensajes en la respuesta inicial, hacer llamada separada
        if (messages.length === 0) {
          try {
            const messagesResponse = await fetch(
              `https://graph.facebook.com/${process.env.META_API_VERSION}/${conversation.id}/messages?fields=message,from,to,created_time,id,sticker,attachments&limit=50&access_token=${accessToken}`
            );
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              messages = messagesData.data || [];
            }
          } catch (error) {
            // Error obteniendo mensajes
            continue;
          }
        }

        if (!messages || messages.length === 0) {
          // Conversación sin mensajes
          continue;
        }

        // Procesando conversación

        // Procesar todos los mensajes de la conversación
        for (const message of messages) {
          try {
            // Verificar que el mensaje tenga datos válidos
            if (!message.id || !message.from?.id) {
              continue;
            }

            // Determinar el tipo de mensaje y el ID del usuario
            const isFromPage = message.from?.id === pageId;
            const type = isFromPage ? 'outgoing' : 'incoming';

            // Para agrupar conversaciones correctamente, siempre usar el ID del usuario
            // Si el mensaje es de la página, buscar el destinatario (usuario)
            // Si el mensaje es del usuario, usar su ID
            let userId;
            if (isFromPage) {
              // Mensaje enviado por la página, buscar el destinatario
              userId = message.to?.data?.[0]?.id || conversation.participants?.data?.find(p => p.id !== pageId)?.id;
            } else {
              // Mensaje enviado por el usuario
              userId = message.from?.id;
            }

            if (userId) {
              // Verificar si el mensaje ya existe para evitar duplicados
              const messageExists = existingMessageIds.has(message.id);

              if (!messageExists) {
                // Agregar al conjunto para evitar duplicados en esta sesión
                existingMessageIds.add(message.id);
                // Guardar mensaje en el almacenamiento usando siempre el userId como senderId para agrupar conversaciones
                MessengerAccountsService.saveMessage({
                  id: message.id,
                  senderId: userId, // Siempre usar el ID del usuario para agrupar conversaciones
                  pageId: pageId,
                  text: message.message || '',
                  timestamp: new Date(message.created_time).getTime(),
                  type: type as "outgoing" | "incoming"
                });
                totalMessagesSynced++;
                // Mensaje guardado
              } else {
                // Mensaje duplicado omitido
              }
            }
          } catch (error) {
            // Error al procesar mensaje
            continue;
          }
        }

        processedConversations++;

        // Pausa más corta entre conversaciones
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        // Error al procesar conversación
        continue;
      }
    }

    // Procesar mensajes enviados por la página
    for (const message of sentMessages) {
      try {
        if (!message.id || !message.to?.data?.[0]?.id) {
          continue;
        }

        const userId = message.to.data[0].id; // ID del usuario destinatario

        // Verificar si el mensaje ya existe para evitar duplicados
        const messageExists = existingMessageIds.has(message.id);

        if (!messageExists) {
          // Agregar al conjunto para evitar duplicados en esta sesión
          existingMessageIds.add(message.id);
          // Guardar mensaje enviado por la página usando el userId para agrupar conversaciones
          MessengerAccountsService.saveMessage({
            id: message.id,
            senderId: userId, // Usar el ID del usuario para agrupar en la misma conversación
            pageId: pageId,
            text: message.message || '',
            timestamp: new Date(message.created_time).getTime(),
            type: 'outgoing'
          });
          totalMessagesSynced++;
          // Mensaje automático guardado
        } else {
          // Mensaje automático duplicado omitido
        }
      } catch (error) {
        // Error al procesar mensaje enviado
        continue;
      }
    }
    // Obtener estadísticas de conversaciones únicas por usuario
    const conversationsByUser = MessengerAccountsService.getConversationsByPage(pageId);
    const uniqueUsers = conversationsByUser.size;

    // Sincronización completada

    // Obtener estadísticas actualizadas
    const stats = MessengerAccountsService.getPageStats(pageId);

    return NextResponse.json({
      success: true,
      messagesSynced: totalMessagesSynced,
      totalMessages: stats.totalMessages,
      totalConversations: stats.totalConversations
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}