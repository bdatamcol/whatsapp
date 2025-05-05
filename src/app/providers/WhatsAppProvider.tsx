'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import WhatsAppClient from '@/lib/whatsapp/whatsapp.client';
import { Contact, Message } from '@/types/whatsapp.d';
import io from 'socket.io-client';

interface WhatsAppState {
  contacts: Contact[];
  messages: Message[];
  selectedContact: string | null;
  loading: boolean;
  error: string | null;
  unreadCounts: Record<string, number>;
}

interface WhatsAppContextType extends WhatsAppState {
  selectContact: (phone: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  refreshContacts: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (messageId: string) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const WhatsAppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WhatsAppState>({
    contacts: [],
    messages: [],
    selectedContact: null,
    loading: false,
    error: null,
    unreadCounts: {},
  });

  const whatsapp = new WhatsAppClient();

  // Conexión con Socket.io para actualización en tiempo real
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Conectado al servidor Socket.io');
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor Socket.io');
    });

    socket.on('newMessage', (newMessage: Message) => {
      setState(prev => {
        // Actualizar el último mensaje en los contactos
        const updatedContacts = prev.contacts.map(contact => {
          if (contact.id === newMessage.from) {
            return {
              ...contact,
              lastMessage: newMessage.text,
              lastMessageTime: newMessage.timestamp,
            };
          }
          return contact;
        });

        // Incrementar contador de no leídos si no es el chat activo
        const newUnreadCounts = { ...prev.unreadCounts };
        if (prev.selectedContact !== newMessage.from) {
          newUnreadCounts[newMessage.from] = (newUnreadCounts[newMessage.from] || 0) + 1;
        }

        // Actualizar o agregar el mensaje
        const existingIndex = prev.messages.findIndex(m => m.id === newMessage.id);
        if (existingIndex !== -1) {
          const updatedMessages = [...prev.messages];
          updatedMessages[existingIndex] = newMessage;
          return {
            ...prev,
            contacts: updatedContacts,
            messages: updatedMessages,
            unreadCounts: newUnreadCounts,
          };
        }

        return {
          ...prev,
          contacts: updatedContacts,
          messages: [...prev.messages, newMessage],
          unreadCounts: newUnreadCounts,
        };
      });
    });

    socket.on('messageStatus', (update: { id: string; status: string }) => {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === update.id ? { ...msg, status: update.status } : msg
        ),
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadContacts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/whatsapp/contacts');
      if (!response.ok) throw new Error('Error al cargar contactos');
      const contacts: Contact[] = await response.json();
      
      // Inicializar contadores de no leídos
      const unreadCounts = contacts.reduce((acc, contact) => ({
        ...acc,
        [contact.id]: contact.unread || 0,
      }), {} as Record<string, number>);

      setState(prev => ({ 
        ...prev, 
        contacts, 
        unreadCounts,
        loading: false 
      }));
    } catch (error) {
      console.error('Error loading contacts:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar contactos', 
        loading: false 
      }));
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!state.selectedContact || !message.trim()) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Crear mensaje optimista
      const tempId = `temp-${Date.now()}`;
      const newMsg: Message = {
        id: tempId,
        from: state.selectedContact,
        text: message,
        timestamp: new Date().toISOString(),
        direction: 'outbound',
        status: 'sending',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMsg],
      }));

      // Enviar mensaje real
      const response = await whatsapp.sendText(state.selectedContact, message);
      
      // Actualizar mensaje con ID real y estado
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: response.id, status: 'sent' } 
            : msg
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => !msg.id.startsWith('temp-')),
        error: 'Error al enviar mensaje',
        loading: false,
      }));
    }
  }, [state.selectedContact]);

  const selectContact = useCallback(async (phone: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedContact: phone, 
      loading: true, 
      error: null,
      unreadCounts: {
        ...prev.unreadCounts,
        [phone]: 0, // Resetear contador de no leídos
      },
    }));

    try {
      const response = await fetch(`/api/whatsapp/messages?contact=${phone}`);
      if (!response.ok) throw new Error('Error al cargar mensajes');
      
      const messages: Message[] = await response.json();
      
      setState(prev => ({
        ...prev,
        messages,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar mensajes', 
        loading: false 
      }));
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!state.selectedContact || state.messages.length === 0) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const oldestMessage = state.messages[0];
      const response = await fetch(
        `/api/whatsapp/messages?contact=${state.selectedContact}&before=${oldestMessage.timestamp}`
      );
      
      const olderMessages: Message[] = await response.json();
      
      setState(prev => ({
        ...prev,
        messages: [...olderMessages, ...prev.messages],
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading more messages:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar más mensajes', 
        loading: false 
      }));
    }
  }, [state.selectedContact, state.messages]);

  const markAsRead = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read' } : msg
      ),
    }));
  }, []);

  useEffect(() => {
    loadContacts();
    
    // Polling de respaldo cada 30 segundos
    const interval = setInterval(loadContacts, 30000);
    return () => clearInterval(interval);
  }, [loadContacts]);

  return (
    <WhatsAppContext.Provider
      value={{
        ...state,
        selectContact,
        sendMessage,
        refreshContacts: loadContacts,
        loadMoreMessages,
        markAsRead,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = (): WhatsAppContextType => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp debe usarse dentro de WhatsAppProvider');
  }
  return context;
};