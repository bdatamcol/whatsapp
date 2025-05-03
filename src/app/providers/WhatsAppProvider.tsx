// app/providers/WhatsAppProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import WhatsAppClient from '@/lib/whatsapp/whatsapp.client';
import { Contact, Message } from '@/types/whatsapp.d';
import io  from 'socket.io-client';

interface WhatsAppState {
  contacts: Contact[];
  messages: Message[];
  selectedContact: string | null;
  loading: boolean;
  error: string | null;
}

interface WhatsAppContextType extends WhatsAppState {
  selectContact: (phone: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  refreshContacts: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const WhatsAppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WhatsAppState>({
    contacts: [],
    messages: [],
    selectedContact: null,
    loading: false,
    error: null,
  });

  const whatsapp = new WhatsAppClient();

  // Conexión con Socket.io para actualización en tiempo real
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    
    socket.on('newMessage', (newMessage) => {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage]
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
      setState(prev => ({ ...prev, contacts, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al cargar contactos', loading: false }));
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!state.selectedContact || !message.trim()) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await whatsapp.sendText(state.selectedContact, message);
      
      const newMsg: Message = {
        id: Date.now().toString(),
        text: message,
        timestamp: new Date().toISOString(),
        direction: 'outbound',
        status: 'sent'
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMsg],
        loading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al enviar mensaje', loading: false }));
    }
  }, [state.selectedContact]);

  const selectContact = useCallback(async (phone: string) => {
    setState(prev => ({ ...prev, selectedContact: phone, loading: true, error: null }));
    try {
      const response = await fetch(`/api/whatsapp/messages?contact=${phone}`);
      if (!response.ok) throw new Error('Error al cargar mensajes');
      const messages: Message[] = await response.json();
      setState(prev => ({ ...prev, messages, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al cargar mensajes', loading: false }));
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!state.selectedContact) return;
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
        loading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al cargar más mensajes', loading: false }));
    }
  }, [state.selectedContact, state.messages]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return (
    <WhatsAppContext.Provider
      value={{
        ...state,
        selectContact,
        sendMessage,
        refreshContacts: loadContacts,
        loadMoreMessages
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