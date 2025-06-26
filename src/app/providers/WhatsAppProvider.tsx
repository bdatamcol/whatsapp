// src/app/providers/WhatsAppProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import  io  from 'socket.io-client';

// Tipos de datos
export interface Message {
  id: string;
  from?: string;
  to?: string;
  text: string;
  timestamp: string | Date;
  direction: 'inbound' | 'outbound';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Contact {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string | Date;
  unread?: number;
  avatar?: string;
  isOnline?: boolean;
}

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

  const [socket, setSocket] = useState<any>(null);

  // Actualizar estado con nuevo mensaje
  const updateStateWithNewMessage = useCallback((prev: WhatsAppState, newMessage: Message): WhatsAppState => {
    const updatedContacts = prev.contacts.map(contact =>
      contact.id === newMessage.from || contact.id === newMessage.to
        ? { 
            ...contact, 
            lastMessage: newMessage.text, 
            lastMessageTime: newMessage.timestamp 
          }
        : contact
    );

    const newUnreadCounts = { ...prev.unreadCounts };
    if (prev.selectedContact !== newMessage.from && newMessage.direction === 'inbound') {
      newUnreadCounts[newMessage.from!] = (newUnreadCounts[newMessage.from!] || 0) + 1;
    }

    const existingIndex = prev.messages.findIndex(m => m.id === newMessage.id);
    if (existingIndex !== -1) {
      const updatedMessages = [...prev.messages];
      updatedMessages[existingIndex] = newMessage;
      return { 
        ...prev, 
        contacts: updatedContacts, 
        messages: updatedMessages, 
        unreadCounts: newUnreadCounts 
      };
    }

    return {
      ...prev,
      contacts: updatedContacts,
      messages: [newMessage, ...prev.messages],
      unreadCounts: newUnreadCounts,
    };
  }, []);

  // Conexión con Socket.io
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('newMessage', (newMessage: Message) => {
      setState(prev => updateStateWithNewMessage(prev, newMessage));
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [updateStateWithNewMessage]);

  // Cargar contactos
  const loadContacts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const res = await fetch('/api/whatsapp/contacts');
      if (!res.ok) throw new Error('Error al cargar contactos');
      
      const contacts: Contact[] = await res.json();
      
      setState(prev => ({
        ...prev,
        contacts: contacts.map(contact => ({
          ...contact,
          isOnline: Math.random() > 0.5 // Simulación de estado online
        })),
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

  // Seleccionar contacto
  const selectContact = useCallback(async (phone: string) => {
    setState(prev => ({
      ...prev,
      selectedContact: phone,
      loading: true,
      error: null,
      unreadCounts: { ...prev.unreadCounts, [phone]: 0 },
    }));

    try {
      const res = await fetch(`/api/whatsapp/messages?contact=${phone}`);
      if (!res.ok) throw new Error('Error al cargar mensajes');
      
      const messages = await res.json();
      setState(prev => ({ ...prev, messages, loading: false }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar mensajes', 
        loading: false 
      }));
    }
  }, []);

  // Enviar mensaje
  const sendMessage = useCallback(async (message: string) => {
    if (!state.selectedContact || !message.trim()) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const tempId = `temp-${Date.now()}`;
      const newMsg: Message = {
        id: tempId,
        from: state.selectedContact,
        text: message,
        timestamp: new Date().toISOString(),
        direction: 'outbound',
        status: 'sending',
      };
      
      // Actualización optimista
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMsg],
      }));
      
      // Enviar mensaje al servidor
      const response = await fetch('/api/whatsapp/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: state.selectedContact,
          message
        })
      });
      
      if (!response.ok) throw new Error('Error al enviar mensaje');
      
      const { id } = await response.json();
      
      // Actualizar estado con el mensaje confirmado
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === tempId ? { ...msg, id, status: 'sent' } : msg
        ),
        contacts: prev.contacts.map(contact =>
          contact.id === state.selectedContact
            ? { 
                ...contact, 
                lastMessage: message, 
                lastMessageTime: new Date().toISOString() 
              }
            : contact
        ),
        loading: false,
      }));
      
      // Notificar a través de socket
      if (socket) {
        socket.emit('newMessage', { ...newMsg, id, status: 'sent' });
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

  // Cargar más mensajes
  const loadMoreMessages = useCallback(async () => {
    if (!state.selectedContact || state.messages.length === 0 || state.loading) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const oldestMessage = state.messages[state.messages.length - 1];
      const before = oldestMessage?.timestamp instanceof Date
        ? oldestMessage.timestamp.toISOString()
        : oldestMessage?.timestamp || new Date().toISOString();
      
      const res = await fetch(
        `/api/whatsapp/messages?contact=${state.selectedContact}&before=${encodeURIComponent(before)}`
      );
      
      if (!res.ok) throw new Error('Error al cargar más mensajes');
      
      const olderMessages = await res.json();
      
      setState(prev => ({
        ...prev,
        messages: olderMessages.length > 0
          ? [...prev.messages, ...olderMessages]
          : prev.messages,
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
  }, [state.selectedContact, state.messages, state.loading]);

  // Marcar como leído
  const markAsRead = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === messageId ? { ...msg, status: 'read' } : msg
      ),
    }));
  }, []);

  // Cargar contactos al iniciar
  useEffect(() => {
    loadContacts();
    const interval = setInterval(loadContacts, 30000); // Actualizar cada 30 segundos
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