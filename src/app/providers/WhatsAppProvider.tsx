// src/app/providers/WhatsAppProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import WhatsAppClient from '@/lib/whatsapp/whatsapp.client';
import { Contact, Message } from '@/types/whatsapp.d';
import { getMessagesByContact, getLastMessagesForContacts } from '@/lib/whatsapp/database/message-repository';

const io = require('socket.io-client').io;


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

  const [socket, setSocket] = useState<any>(null); // Usamos any temporalmente para Socket
  const whatsapp = new WhatsAppClient();

  // Conexión con Socket.io para actualización en tiempo real
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Conectado al servidor Socket.io');
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado del servidor Socket.io');
    });

    newSocket.on('newMessage', (newMessage: Message) => {
      setState(prev => {
        // Actualizar el último mensaje en los contactos
        const updatedContacts = prev.contacts.map(contact => {
          if (contact.id === newMessage.from || contact.id === newMessage.to) {
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
        if (prev.selectedContact !== newMessage.from && newMessage.direction === 'inbound') {
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
          messages: [newMessage, ...prev.messages],
          unreadCounts: newUnreadCounts,
        };
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const loadContacts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const contactsResponse = await fetch('/api/whatsapp/contacts');
      if (!contactsResponse.ok) throw new Error('Error al cargar contactos');
      
      const contacts: Contact[] = await contactsResponse.json();
      
      // Obtener últimos mensajes solo si hay contactos
      let lastMessages: Message[] = [];
      if (contacts.length > 0) {
        try {
          lastMessages = await getLastMessagesForContacts();
        } catch (error) {
          console.error('Error al obtener últimos mensajes:', error);
        }
      }

      // Combinar contactos con sus últimos mensajes
      const contactsWithLastMessage = contacts.map(contact => {
        const lastMsg = lastMessages.find(msg => 
          msg.from === contact.id || msg.to === contact.id
        );
        
        return {
          ...contact,
          lastMessage: lastMsg?.text || '',
          lastMessageTime: lastMsg?.timestamp || new Date().toISOString(),
          isOnline: Math.random() > 0.5 // Simulación - reemplazar con lógica real
        };
      });

      setState(prev => ({
        ...prev,
        contacts: contactsWithLastMessage,
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

      // Actualizar último mensaje en la lista de contactos
      setState(prev => ({
        ...prev,
        contacts: prev.contacts.map(contact =>
          contact.id === state.selectedContact
            ? {
                ...contact,
                lastMessage: message,
                lastMessageTime: new Date().toISOString()
              }
            : contact
        )
      }));

      if (socket) {
        socket.emit('newMessage', {
          ...newMsg,
          id: response.id,
          status: 'sent'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => !msg.id.startsWith('temp-')),
        error: 'Error al enviar mensaje',
        loading: false,
      }));
    }
  }, [state.selectedContact, socket]);

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
      const messages = await getMessagesByContact(phone);
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
    // Validaciones iniciales
    if (!state.selectedContact || state.messages.length === 0 || state.loading) {
      return;
    }
  
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const oldestMessage = state.messages[state.messages.length - 1];
      
      // Validación completa del timestamp
      if (!oldestMessage?.timestamp) {
        console.warn('No se encontró timestamp en el mensaje más antiguo');
        return setState(prev => ({ ...prev, loading: false }));
      }
  
      // Conversión segura del timestamp
      const beforeTimestamp = typeof oldestMessage.timestamp === 'string' 
        ? oldestMessage.timestamp 
        : oldestMessage.timestamp instanceof Date 
          ? oldestMessage.timestamp.toISOString()
          : new Date().toISOString();
  
      const olderMessages = await getMessagesByContact(
        state.selectedContact,
        20,
        beforeTimestamp
      );
  
      // Actualización condicional del estado
      setState(prev => ({
        ...prev,
        messages: olderMessages.length > 0 
          ? [...prev.messages, ...olderMessages]
          : prev.messages,
        loading: false,
      }));
    } catch (error) {
      console.error('Error al cargar más mensajes:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al cargar más mensajes',
        loading: false
      }));
    }
  }, [state.selectedContact, state.messages, state.loading]);
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