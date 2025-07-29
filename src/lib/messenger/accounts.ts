// Servicio simple para manejar múltiples cuentas de Messenger
export interface MessengerMessage {
  id: string;
  senderId: string;
  pageId: string;
  text: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  senderName?: string; // Nombre del remitente para mostrar en la interfaz
}

export interface MessengerAccount {
  pageId: string;
  pageName: string;
  accessToken: string;
}

// Almacenamiento temporal en memoria (para pruebas)
// En producción, usa una base de datos
const messagesStore: Map<string, MessengerMessage[]> = new Map();

export class MessengerAccountsService {
  
  // Obtener el token de acceso para una página específica
  static getPageAccessToken(pageId: string): string | null {
    // Busca el token específico para la página
    const specificToken = process.env[`FACEBOOK_PAGE_TOKEN_${pageId}`];
    if (specificToken && specificToken !== 'TU_TOKEN_AQUI') {
      return specificToken;
    }
    
    // Busca el token general de página
    const generalPageToken = process.env.FACEBOOK_PAGE_TOKEN;
    if (generalPageToken && generalPageToken !== 'TU_TOKEN_AQUI') {
      return generalPageToken;
    }
    
    // Como último recurso, usa el token de acceso general
    const generalAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (generalAccessToken && generalAccessToken !== 'TU_TOKEN_AQUI') {
      return generalAccessToken;
    }
    
    return null;
  }

  // Guardar mensaje en el almacenamiento
  static saveMessage(message: MessengerMessage): void {
    const key = `${message.pageId}_${message.senderId}`;
    
    if (!messagesStore.has(key)) {
      messagesStore.set(key, []);
    }
    
    messagesStore.get(key)!.push(message);
    
    // Limitar a los últimos 100 mensajes por conversación
    if (messagesStore.get(key)!.length > 100) {
      messagesStore.set(key, messagesStore.get(key)!.slice(-100));
    }
  }

  // Obtener mensajes de una conversación específica
  static getMessages(pageId: string, senderId: string): MessengerMessage[] {
    const key = `${pageId}_${senderId}`;
    return messagesStore.get(key) || [];
  }

  // Obtener todas las conversaciones de una página
  static getConversationsByPage(pageId: string): Map<string, MessengerMessage[]> {
    const conversations = new Map();
    
    for (const [key, messages] of messagesStore) {
      if (key.startsWith(`${pageId}_`)) {
        const senderId = key.replace(`${pageId}_`, '');
        conversations.set(senderId, messages);
      }
    }
    
    return conversations;
  }

  // Limpiar todos los mensajes de una página específica
  static clearPageMessages(pageId: string): void {
    const keysToDelete = [];
    
    for (const key of messagesStore.keys()) {
      if (key.startsWith(`${pageId}_`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => messagesStore.delete(key));
  }

  // Obtener todos los mensajes de una página
  static getAllMessages(pageId: string): MessengerMessage[] {
    const allMessages: MessengerMessage[] = [];
    
    for (const [key, messages] of messagesStore) {
      if (key.startsWith(`${pageId}_`)) {
        allMessages.push(...messages);
      }
    }
    
    return allMessages;
  }

  // Obtener estadísticas simples por página
  static getPageStats(pageId: string): {
    totalConversations: number;
    totalMessages: number;
    lastMessageAt?: number;
  } {
    const conversations = this.getConversationsByPage(pageId);
    let totalMessages = 0;
    let lastMessageAt: number | undefined;

    for (const messages of conversations.values()) {
      totalMessages += messages.length;
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && (!lastMessageAt || lastMessage.timestamp > lastMessageAt)) {
        lastMessageAt = lastMessage.timestamp;
      }
    }

    return {
      totalConversations: conversations.size,
      totalMessages,
      lastMessageAt
    };
  }
}