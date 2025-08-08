'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useEffect, useState, useRef } from 'react';
import { Send, ImagePlus, Loader2 } from 'lucide-react';

import Input from '../ui/Input';
import Button from '../ui/Button';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'assistant_humano';
    content: string;
    timestamp?: string;
    status?: 'read' | 'sent';
    type?: 'text' | 'image';
    imageUrl?: string;
}

interface Props {
    contactId: string;
    role?: 'assistant' | 'assistant_humano';
    companyId: string; // <--- Lo recibes directamente
}

export default function ChatView({ contactId, role = 'assistant', companyId }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showShortcut, setShowShortcut] = useState(false);

    // Agregar atajo de teclado para adjuntar imagen
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Ctrl+Shift+I para abrir el selector de archivos
            if (event.ctrlKey && event.shiftKey && event.key === 'I') {
                event.preventDefault();
                handleImageButtonClick();
            }
        };

        // Mostrar tooltip cuando se presiona Ctrl
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.shiftKey) {
                setShowShortcut(true);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!event.ctrlKey || !event.shiftKey) {
                setShowShortcut(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const fetchMessages = async () => {
        const res = await fetch(`/api/whatsapp/messagess/${contactId}?companyId=${companyId}`);
        const data = await res.json();
        setMessages(data);
    };

    useEffect(() => {
        fetchMessages();
    }, [contactId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const channel = supabase
            .channel(`chat-${contactId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `phone=eq.${contactId}`,
                },
                () => {
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
            id: crypto.randomUUID(),
            role: role,
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue('');

        try {
            const response = await fetch('/api/whatsapp/messagess/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: contactId,
                    message: inputValue,
                    role,
                    companyId,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            // Error al enviar el mensaje
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('Por favor selecciona una imagen JPG o PNG');
            return;
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('La imagen no debe superar los 5MB');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('phone', contactId);
            formData.append('companyId', companyId);
            formData.append('role', role);

            const response = await fetch('/api/whatsapp/messagess/send-image', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Error al enviar imagen');
            }

            // Agregar mensaje de imagen a la conversación local
            const newMessage: Message = {
                id: result.messageId || crypto.randomUUID(),
                role: role,
                content: `📸 Imagen enviada: ${file.name}`,
                timestamp: new Date().toISOString(),
                type: 'image',
                imageUrl: result.imageUrl,
            };
            setMessages((prev) => [...prev, newMessage]);

        } catch (error) {
            console.error('Error al subir imagen:', error);
            alert('Error al enviar la imagen. Por favor intenta de nuevo.');
        } finally {
            setIsUploading(false);
            // Limpiar el input de archivo
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <div className="p-4 border-b bg-white shadow">
                <h2 className="font-semibold text-lg">{contactId}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, i) => {
                    const isAssistant = msg.role === 'assistant';
                    const isHumanAssistant = msg.role === 'assistant_humano';
                    const isUser = msg.role === 'user';

                    return (
                        <div key={i} className={`flex ${isAssistant || isHumanAssistant ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`p-3 rounded-lg max-w-xs relative ${isAssistant
                                        ? 'bg-blue-500 text-white'
                                        : isHumanAssistant
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white border'
                                    }`}
                            >
                                {msg.type === 'image' && msg.imageUrl ? (
                                    <div>
                                        <img 
                                            src={msg.imageUrl} 
                                            alt={msg.content}
                                            className="max-w-full h-auto rounded-md mb-2 cursor-pointer"
                                            onClick={() => window.open(msg.imageUrl, '_blank')}
                                        />
                                        <p className="text-sm">{msg.content.replace('📸 Imagen enviada: ', '')}</p>
                                    </div>
                                ) : (
                                    <p>{msg.content}</p>
                                )}

                                {isHumanAssistant && (
                                    <div className="absolute -top-5 right-0 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        Asistente humano 👤
                                    </div>
                                )}

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

            <div className="p-4 border-t bg-white relative">
                {/* Tooltip de atajo de teclado */}
                {showShortcut && (
                    <div className="absolute -top-10 left-4 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                        Presiona <kbd className="bg-gray-600 px-1 rounded">Ctrl</kbd> + <kbd className="bg-gray-600 px-1 rounded">Shift</kbd> + <kbd className="bg-gray-600 px-1 rounded">I</kbd> para adjuntar imagen
                    </div>
                )}
                
                <div className="flex gap-2 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        disabled={isUploading}
                    />
                    <Button
                        variant="outline"
                        size="default"
                        onClick={handleImageButtonClick}
                        disabled={isUploading}
                        className="shrink-0"
                        title="Adjuntar imagen (Ctrl+Shift+I)"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="h-4 w-4" />
                        )}
                    </Button>
                    <Input
                        value={inputValue}
                        placeholder="Escribe un mensaje..."
                        className="flex-1"
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isUploading}
                    />
                    <Button 
                        variant="default" 
                        size="default" 
                        onClick={handleSendMessage} 
                        disabled={!inputValue.trim() || isUploading}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
