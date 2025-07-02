'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useEffect, useState, useRef } from 'react';
import { Send } from 'lucide-react';

import Input from '../ui/Input';
import Button from '../ui/Button';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    status?: 'read' | 'sent';
}

interface Props {
    contactId: string;
}

export default function ChatView({ contactId }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [inputValue, setInputValue] = useState('');

    const fetchMessages = async () => {
        const res = await fetch(`/api/whatsapp/messagess/${contactId}`);
        const data = await res.json();
        setMessages(data);
    };

    // Cargar los mensajes al abrir el chat
    useEffect(() => {
        fetchMessages();
    }, [contactId]);

    // Scroll automático al final
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Escuchar cambios en tiempo real solo para esta conversación
    useEffect(() => {
        const channel = supabase
            .channel(`chat-${contactId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `phone=eq.${contactId}`, //solo para este contacto
                },
                (payload) => {
                    // console.log('Mensajes actualizados para', contactId);
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [contactId]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: crypto.randomUUID(),//ID TEMPORAL
            role: 'assistant',
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue(''); // Limpiar input inmediatamente

        try {
            const response = await fetch('/api/whatsapp/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: contactId,
                    message: inputValue,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Encabezado básico */}
            <div className="p-4 border-b bg-white shadow">
                <h2 className="font-semibold text-lg">{contactId}</h2>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`p-3 rounded-lg max-w-xs ${msg.role === 'assistant'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border'
                                }`}
                        >
                            <p>{msg.content}</p>
                            {msg.role === 'assistant' && (
                                <p className="text-xs mt-1 text-gray-400 text-right">
                                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })} · {msg.status === 'read' ? '✓✓ Leído' : '✓ Enviado'}
                                </p>
                            )}
                            {msg.role === 'user' && (
                                <p className="text-xs mt-1 text-gray-400 text-left">
                                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            )}

                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {/* Input para enviar mensajes */}
            <div className="p-4 border-t bg-white">
                <div className="flex gap-2 items-center">
                    <Input
                        value={inputValue}
                        placeholder="Escribe un mensaje..."
                        className="flex-1"
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Button
                        variant="default"
                        size="default"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>

        </div>
    );
}