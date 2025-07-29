import { NextRequest, NextResponse } from "next/server";
import { MessengerAccountsService } from "@/lib/messenger/accounts";

// GET /api/messenger/messages?pageId=123&senderId=456
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const senderId = searchParams.get('senderId');

    if (!pageId) {
      return NextResponse.json({ error: 'pageId es requerido' }, { status: 400 });
    }

    let messages = [];
    let conversations = new Map();

    if (senderId) {
      // Obtener mensajes de una conversación específica
      messages = MessengerAccountsService.getMessages(pageId, senderId);
    } else {
      // Obtener todas las conversaciones de una página
      conversations = MessengerAccountsService.getConversationsByPage(pageId);
      
      // Convertir a array para JSON con formato de chat por usuario
      const conversationsArray = Array.from(conversations.entries()).map(([senderId, msgs]) => {
        // Ordenar mensajes por timestamp
        const sortedMessages = msgs.sort((a, b) => a.timestamp - b.timestamp);
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        
        return {
          senderId,
          messages: sortedMessages,
          messageCount: sortedMessages.length,
          lastMessage,
          // Información adicional para mostrar en la UI
          chatInfo: {
            userId: senderId,
            userName: lastMessage?.senderName || `Usuario ${senderId.slice(-4)}`, // Usar nombre guardado o fallback
            lastActivity: lastMessage ? new Date(lastMessage.timestamp).toISOString() : null,
            hasUnread: false // Puedes implementar lógica de mensajes no leídos aquí
          }
        };
      }).sort((a, b) => {
        // Ordenar conversaciones por último mensaje (más reciente primero)
        const timeA = a.lastMessage ? a.lastMessage.timestamp : 0;
        const timeB = b.lastMessage ? b.lastMessage.timestamp : 0;
        return timeB - timeA;
      });

      return NextResponse.json({ 
        pageId, 
        conversations: conversationsArray,
        stats: MessengerAccountsService.getPageStats(pageId)
      });
    }

    return NextResponse.json({ 
      pageId, 
      senderId, 
      messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}