'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: string;
  pageId: string;
  text: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
}

interface Conversation {
  senderId: string;
  messages: Message[];
  messageCount: number;
  lastMessage: Message;
  chatInfo: {
    userId: string;
    userName: string;
    lastActivity: string | null;
    hasUnread: boolean;
  };
}

interface PageStats {
  totalConversations: number;
  totalMessages: number;
  lastMessageAt?: number;
}

interface PageInfo {
  pageId: string;
  pageName: string;
  hasToken: boolean;
  stats: PageStats;
}

interface TokenVerification {
  success: boolean;
  canSendMessages: boolean;
  missingPermissions: string[];
  recommendations: string[];
  error?: string;
}

export default function MessengerMessages() {
  const [selectedConversation, setSelectedConversation] = useState<Message[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageInfo | null>(null);
  const [stats, setStats] = useState<PageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Función para limpiar notificaciones
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Query para cargar conversaciones con TanStack Query
  const { data: conversationsData, isLoading: conversationsLoading, refetch: refetchConversations, error } = useQuery({
    queryKey: ['messenger-conversations', selectedPage?.pageId],
    queryFn: async () => {
      if (!selectedPage?.pageId) return { conversations: [], stats: null };

      const response = await fetch(`/api/messenger/messages?pageId=${selectedPage.pageId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar las conversaciones');
      }

      return {
        conversations: Array.isArray(data.conversations) ? data.conversations : [],
        stats: data.stats || { totalConversations: 0, totalMessages: 0 }
      };
    },
    enabled: !!selectedPage?.pageId,
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchInterval: 30 * 60 * 1000, // Refetch cada 30 minutos
    retry: 2,
  });

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      console.error('Error en query de conversaciones:', error);
      toast.error('Error al cargar las conversaciones');
    }
  }, [error]);

  // Obtener todas las conversaciones del query
  const conversations = conversationsData?.conversations || [];

  useEffect(() => {
    loadPages();
    // Para pruebas, establecer una página de prueba por defecto
    setSelectedPage({
      pageId: 'test-page',
      pageName: 'Página de Prueba',
      hasToken: true,
      stats: { totalConversations: 0, totalMessages: 0 }
    });

    // Conectar al stream de notificaciones
    connectToNotifications();

    // Limpiar la conexión al desmontar
    return () => {
      // La conexión se cerrará automáticamente cuando el componente se desmonte
    };
  }, []);

  // Conectar al stream de notificaciones SSE
  const connectToNotifications = () => {
    try {
      const eventSource = new EventSource('/api/messenger/notifications');

      eventSource.onopen = (event) => {};

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Manejar notificaciones temporales de reacciones
          if (data.type === 'reaction_temp') {
            // Mostrar toast temporal que se elimina automáticamente
            const reactionEmoji = {
              'like': '👍',
              'love': '❤️',
              'wow': '😮',
              'haha': '😂',
              'sad': '😢',
              'angry': '😡'
            }[data.reaction_type] || '👍';

            toast(`${reactionEmoji} ${data.senderName || 'Alguien'} reaccionó`, {
              description: `Nueva reacción (${data.reaction_type}) en tu página de Facebook`,
              duration: 3000, // 3 segundos
            });

            return; // No agregar a la lista de notificaciones permanentes
          }

          // Filtrar: no agregar notificaciones para reacciones de tipo 'add' o 'remove'
          if (!(data.type === 'feed' && data.item === 'reaction' && (data.verb === 'add' || data.verb === 'remove'))) {
            // Agregar la notificación a la lista solo si no es una reacción add/remove
            setNotifications(prev => [data, ...prev].slice(0, 10)); // Mantener solo las 10 más recientes

            // Marcar que hay nuevos mensajes solo para mensajes reales, no para reacciones
            if (data.type === 'message' || (data.type === 'feed' && (data.item === 'comment' || data.item === 'post'))) {
              setHasNewMessages(true);
            }
          }
          // NO mostrar notificaciones para mensajes normales para evitar llenar el chat
        } catch (error) {
          console.error('❌ Error procesando notificación:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Error en conexión SSE:', error);
        // Intentar reconectar después de un tiempo
        setTimeout(() => {
          eventSource.close();
          connectToNotifications();
        }, 5000);
      };
    } catch (error) {
      // Error conectando a notificaciones
    }
  };

  // Cargar información de páginas
  const loadPages = async () => {
    try {
      const response = await fetch('/api/messenger/pages');
      const data = await response.json();

      if (data.pages) {
        setPages(data.pages);
        // Cargar conversaciones de la primera página por defecto
        if (data.pages.length > 0) {
          const firstPage = data.pages[0];
          setSelectedPage(firstPage);
          loadConversations(firstPage.pageId);
        }
      }
    } catch (error) {
      // Error cargando páginas
    }
  };

  // Cargar conversaciones de una página
  const loadConversations = async (pageId: string) => {
    // Actualizar página seleccionada
    const page = pages.find(p => p.pageId === pageId);
    if (page) {
      setSelectedPage(page);
      setSelectedConversation([]);
      setSelectedSenderId('');
      // Resetear indicador de nuevos mensajes
      setHasNewMessages(false);
      // El query se ejecutará automáticamente cuando selectedPage cambie
    }
  };

  // Cargar mensajes de una conversación específica
  const loadMessages = async (pageId: string, senderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messenger/messages?pageId=${pageId}&senderId=${senderId}`);
      const data = await response.json();

      if (data.messages) {
        setSelectedConversation(data.messages);
        setSelectedPageId(pageId);
        setSelectedSenderId(senderId);

        // Si estamos viendo una conversación específica, resetear el indicador de nuevos mensajes
        // ya que el usuario está viendo los mensajes
        if (hasNewMessages) {
          setHasNewMessages(false);
        }
      } else {
        setSelectedConversation([]);
      }
    } catch (error) {
      toast.error('Error al cargar los mensajes de la conversación');
    }
    setLoading(false);
  };

  // Formatear timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-CO');
  };

  // Sincronizar mensajes con Facebook
  const syncFacebookMessages = async (pageId: string) => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/messenger/sync?pageId=${pageId}`, {
        method: 'POST'
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Sincronización completada: ${data.messagesSynced || 0} mensajes sincronizados`);
        // Refrescar las conversaciones después de sincronizar
        refetchConversations();
      } else {
        toast.error(`Error al sincronizar: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      toast.error('Error al sincronizar mensajes');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Mensajes de Messenger</h2>

      {/* Selector de página */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Seleccionar página:</label>
        <select
          className="w-full p-2 border rounded"
          onChange={(e) => loadConversations(e.target.value)}
          value={selectedPage?.pageId || ''}
        >
          <option value="">Selecciona una página</option>
          {pages.map(page => (
            <option key={page.pageId} value={page.pageId}>
              {page.pageName} {!page.hasToken && '(Sin token configurado)'}
            </option>
          ))}
        </select>
      </div>

      {/* Información de la página seleccionada */}
      {selectedPage && (
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-blue-800">{selectedPage.pageName}</h3>
                {hasNewMessages && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                    ¡Nuevos mensajes!
                  </span>
                )}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                <span className="mr-4">📊 {selectedPage.stats.totalConversations} conversaciones</span>
                <span className="mr-4">💬 {selectedPage.stats.totalMessages} mensajes totales</span>
                <span className={`px-2 py-1 rounded text-xs ${selectedPage.hasToken
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {selectedPage.hasToken ? '✅ Token configurado' : '⚠️ Sin token'}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              {selectedPage.hasToken && (
                <button
                  onClick={() => syncFacebookMessages(selectedPage.pageId)}
                  disabled={syncing}
                  className={`px-4 py-2 rounded text-sm font-medium ${syncing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar con Facebook'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {(loading || conversationsLoading) && <div className="text-center py-4">Cargando...</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lista de conversaciones - Todas */}
        <div>
          <h3 className="font-semibold mb-2">Todas las Conversaciones ({conversations.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div className="mb-2">📭 No hay conversaciones disponibles</div>
                {selectedPage?.hasToken ? (
                  <div className="text-sm">
                    💡 Haz clic en "🔄 Sincronizar con Facebook" para cargar conversaciones
                  </div>
                ) : (
                  <div className="text-sm text-yellow-600">
                    ⚠️ Configura un token de Facebook para esta página
                  </div>
                )}
              </div>
            ) : (
              conversations.map((conversation, index) => (
                <div
                  key={`chat-${conversation.senderId}-${index}`}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedSenderId === conversation.senderId
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  onClick={() => loadMessages(conversation.lastMessage.pageId, conversation.senderId)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {conversation.chatInfo.userName.slice(-2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-800">
                          {conversation.chatInfo.userName}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {conversation.senderId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">
                        #{index + 1}
                      </div>
                      {conversation.chatInfo.hasUnread && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 truncate mb-2 pl-12">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${conversation.lastMessage.type === 'incoming' ? 'bg-blue-400' : 'bg-green-400'
                      }`}></span>
                    {conversation.lastMessage.text || 'Sin mensaje de texto'}
                  </div>

                  <div className="flex justify-between items-center pl-12">
                    <div className="text-xs text-gray-400">
                      {formatTimestamp(conversation.lastMessage.timestamp)}
                    </div>
                    <div className="flex space-x-2">
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {conversation.messageCount} mensajes
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${conversation.lastMessage.type === 'incoming'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {conversation.lastMessage.type === 'incoming' ? '📥 Recibido' : '📤 Enviado'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mensajes de la conversación seleccionada */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Chat</h3>
            {selectedSenderId && (
              <div className="text-sm text-gray-600">
                Conversación con Usuario: {selectedSenderId.slice(-4)}
              </div>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 mb-3 bg-gray-50">
            {selectedConversation.length === 0 ? (
              <div className="text-gray-500 text-center py-12">
                <div className="text-4xl mb-2">💬</div>
                <div className="font-medium mb-1">Selecciona una conversación</div>
                <div className="text-sm">Elige un chat de la lista para ver los mensajes</div>
              </div>
            ) : (
              selectedConversation.map((message, index) => (
                <div
                  key={`msg-${message.id}-${index}`}
                  className={`flex ${message.type === 'incoming' ? 'justify-start' : 'justify-end'
                    }`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${message.type === 'incoming'
                    ? 'bg-white border border-gray-200 text-gray-800'
                    : 'bg-blue-500 text-white'
                    }`}>
                    <div className="text-sm leading-relaxed">
                      {message.text || 'Mensaje sin texto'}
                    </div>
                    <div className={`text-xs mt-1 ${message.type === 'incoming' ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                      {formatTimestamp(message.timestamp)}
                      {message.type === 'outgoing' && (
                        <span className="ml-1">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}