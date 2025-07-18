'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useEffect, useState, useRef } from 'react';
import { Send } from 'lucide-react';

import Input from '../ui/Input';
import Button from '../ui/Button';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'assistant_humano';
    content: string;
    timestamp?: string;
    status?: 'read' | 'sent';
}

interface Props {
    contactId: string;
    role?: 'assistant' | 'assistant_humano'; // nuevo
}

export default function ChatView({ contactId, role = 'assistant' }: Props) {
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
            role: role || 'assistant',
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue(''); // Limpiar input inmediatamente

        try {
            const response = await fetch('/api/whatsapp/messagess/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: contactId,
                    message: inputValue,
                    role
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
                {messages.map((msg, i) => {
                    const isAssistant = msg.role === 'assistant';
                    const isHumanAssistant = msg.role === 'assistant_humano';
                    const isUser = msg.role === 'user';

                    return (
                        <div
                            key={i}
                            className={`flex ${isAssistant || isHumanAssistant ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`p-3 rounded-lg max-w-xs relative ${isAssistant
                                        ? 'bg-blue-500 text-white'
                                        : isHumanAssistant
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white border'
                                    }`}
                            >
                                <p>{msg.content}</p>

                                {/* Etiqueta de rol si es humano */}
                                {isHumanAssistant && (
                                    <div className="absolute -top-5 right-0 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        Asistente humano 👤
                                    </div>
                                )}

                                {/* Timestamp */}
                                <p
                                    className={`text-xs mt-1 ${isUser ? 'text-gray-400 text-left' : 'text-gray-200 text-right'
                                        }`}
                                >
                                    {msg.timestamp &&
                                        new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    {isAssistant || isHumanAssistant ? (
                                        <> · {msg.status === 'read' ? '✓✓ Leído' : '✓ Enviado'}</>
                                    ) : null}
                                </p>
                            </div>
                        </div>
                    );
                })}
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