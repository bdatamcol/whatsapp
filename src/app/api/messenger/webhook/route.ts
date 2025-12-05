import { NextRequest, NextResponse } from "next/server";

// verify webhook messenger
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const challenge = searchParams.get('hub.challenge');
    const verify_token = searchParams.get('hub.verify_token');

    if (mode && verify_token) {
        if (mode === 'subscribe' && verify_token === process.env.VERYFY_WEBHOOK_SECRET) {
            // Webhook verificado
            return new NextResponse(challenge, { status: 200 });
        } else {
            return NextResponse.json('Error de validacion', { status: 403 });
        }
    }
}

// handle incoming messages
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Notificar a través de eventos del servidor (SSE) que hay un nuevo mensaje
        // Esto será capturado por el frontend para mostrar notificaciones
        try {
            const { notifyNewMessage } = await import('@/lib/messenger/notifications');
            notifyNewMessage(body);
        } catch (error) {
            console.error('Error al notificar nuevo mensaje:', error);
        }

        // Verificar que es un mensaje válido de Messenger
        if (!body.object || !body.entry) {
            return NextResponse.json({ message: 'Not a valid webhook' }, { status: 400 });
        }

        // Procesar cada entrada (puede ser de diferentes páginas/cuentas)
        for (const entry of body.entry) {
            const pageId = entry.id; // ID de la página que recibió el mensaje

            // Procesar mensajes de Messenger
            if (entry.messaging) {
                for (const messagingEvent of entry.messaging) {
                    // Manejar mensajes
                    if (messagingEvent.message) {
                        await handleMessage(messagingEvent, pageId);
                    }
                }
            }

            // Procesar cambios en feed (comentarios, publicaciones, etc.)
            if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'feed') {
                        await handleFeedChange(change.value, pageId);
                    }
                }
            }
        }

        return NextResponse.json({ message: 'EVENT_RECEIVED' }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: 'Error processing webhook' }, { status: 500 });
    }
}

// Función simple para manejar mensajes de texto
async function handleMessage(messagingEvent: any, pageId: string) {
    const senderId = messagingEvent.sender.id;
    const message = messagingEvent.message;

    // Mensaje procesado

    // Importar dinámicamente el servicio para evitar problemas de SSR
    const { MessengerAccountsService } = await import('@/lib/messenger/accounts');

    // Intentar obtener el nombre del remitente
    let senderName = '';
    try {
        // Si el evento incluye el nombre del remitente, usarlo
        if (messagingEvent.sender.name) {
            senderName = messagingEvent.sender.name;
        } else {
            // Intentar obtener el nombre del remitente desde la API de Facebook
            const pageAccessToken = MessengerAccountsService.getPageAccessToken(pageId);
            if (pageAccessToken) {
                const response = await fetch(`https://graph.facebook.com/${process.env.META_API_VERSION}/${senderId}?fields=name&access_token=${pageAccessToken}`);
                const data = await response.json();
                if (data.name) {
                    senderName = data.name;
                }
            }
        }
    } catch (error) {
        // Error obteniendo nombre del remitente
    }

    // Guardar mensaje entrante
    const incomingMessage = {
        id: messagingEvent.message.mid || Date.now().toString(),
        senderId,
        pageId,
        text: message.text || '',
        timestamp: messagingEvent.timestamp,
        type: 'incoming' as const,
        senderName: senderName || `Usuario ${senderId.slice(-4)}` // Usar nombre o fallback
    };

    MessengerAccountsService.saveMessage(incomingMessage);

    // Mostrar estadísticas en consola
    const stats = MessengerAccountsService.getPageStats(pageId);
    // Stats actualizadas
}

// Función para manejar cambios en el feed (comentarios, publicaciones, etc.)
async function handleFeedChange(value: any, pageId: string) {
    // Cambio en feed procesado

    // Importar dinámicamente el servicio para evitar problemas de SSR
    const { MessengerAccountsService } = await import('@/lib/messenger/accounts');
    const { notifyNewMessage } = await import('@/lib/messenger/notifications');

    // Verificar si tenemos información del remitente
    if (value.from && value.from.id) {
        const senderId = value.from.id;
        const senderName = value.from.name || '';

        // Detectar reacciones (likes, etc.) - Las reacciones ya se procesan en el webhook principal
        if (value.item === 'reaction') {
            // No enviar notificación aquí para evitar duplicados
            // La notificación ya se envía desde el webhook principal
            return; // No hacer nada más para las reacciones
        }

        // Para comentarios y publicaciones, procesar normalmente
        if (value.item === 'comment' || value.item === 'post') {
            // Para comentarios y publicaciones, sí guardar como mensaje
            let messageText = '';

            if (value.item === 'comment') {
                if (value.verb === 'add') {
                    messageText = 'Nuevo comentario en una publicación';
                } else if (value.verb === 'remove') {
                    messageText = 'Comentario eliminado de una publicación';
                } else if (value.verb === 'edit') {
                    messageText = 'Comentario editado en una publicación';
                } else {
                    messageText = `Acción ${value.verb} en un comentario`;
                }
            } else if (value.item === 'post') {
                if (value.post && value.post.status_type) {
                    messageText = `Nueva publicación: ${value.post.status_type}`;
                    if (value.post.permalink_url) {
                        messageText += ` - ${value.post.permalink_url}`;
                    }
                } else {
                    messageText = 'Nueva actividad en una publicación';
                }
            }

            // Guardar como mensaje solo si es comentario o publicación
            if (messageText) {
                const incomingMessage = {
                    id: `feed_${Date.now().toString()}`,
                    senderId,
                    pageId,
                    text: messageText,
                    timestamp: value.created_time || Date.now(),
                    type: 'incoming' as const,
                    senderName
                };

                MessengerAccountsService.saveMessage(incomingMessage);

                // Mostrar estadísticas en consola
                const stats = MessengerAccountsService.getPageStats(pageId);
                // Stats actualizadas después de cambio en feed
            }
        }
    }
}