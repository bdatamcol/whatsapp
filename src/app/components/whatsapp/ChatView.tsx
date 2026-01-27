'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useEffect, useState, useRef } from 'react';
import { Send, ImagePlus, Loader2, FileText, X } from 'lucide-react';

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
    
    // Estados para asignación
    const [assistants, setAssistants] = useState<{ id: string; email: string }[]>([]);
    const [assignedTo, setAssignedTo] = useState<string | null>(null);
    const [loadingAssign, setLoadingAssign] = useState(false);
    const [isLead, setIsLead] = useState(false);

    // Estados para plantillas
    const [showTemplates, setShowTemplates] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Cargar asistentes, asignación actual y verificar si es lead
    useEffect(() => {
        const loadAssignmentData = async () => {
            // 1. Asistentes
            const { data: asstData } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('role', 'assistant')
                .eq('company_id', companyId)
                .eq('is_active', true);
            setAssistants(asstData || []);

            // 2. Asignación actual
            const { data: currentAssign } = await supabase
                .from('assistants_assignments')
                .select('assigned_to')
                .eq('contact_phone', contactId)
                .eq('company_id', companyId)
                .eq('active', true)
                .maybeSingle();
            
            setAssignedTo(currentAssign?.assigned_to || null);

            // 3. Verificar si es lead
            const { data: contactData } = await supabase
                .from('contacts')
                .select('tags')
                .eq('phone', contactId)
                .eq('company_id', companyId)
                .maybeSingle();
            
            if (contactData?.tags && Array.isArray(contactData.tags)) {
                setIsLead(contactData.tags.includes('lead'));
            } else {
                setIsLead(false);
            }
        };

        if (companyId && contactId) {
            loadAssignmentData();
        }
    }, [contactId, companyId]);

    const handleAssign = async (assistantId: string) => {
        if (!assistantId) return;
        setLoadingAssign(true);
        try {
            const res = await fetch('/api/admin/assign-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: contactId, assistantId })
            });
            if (!res.ok) throw new Error('Error asignando');
            
            setAssignedTo(assistantId);
            // Opcional: Mostrar toast de éxito
        } catch (error) {
            console.error(error);
            alert('Error al asignar');
        } finally {
            setLoadingAssign(false);
        }
    };

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const res = await fetch(`/api/templates/list?companyId=${companyId}&limit=100`);
            const data = await res.json();
            if (data.ok) {
                const allTemplates = data.data.data || [];
                // Filtrar solo las plantillas APROBADAS
                const approvedTemplates = allTemplates.filter((t: any) => t.status === 'APPROVED');
                setTemplates(approvedTemplates);
            }
        } catch (error) {
            console.error('Error cargando plantillas', error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSendTemplate = async (template: any) => {
        try {
            const res = await fetch('/api/whatsapp/templates/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: contactId,
                    templateName: template.name,
                    language: template.language,
                    companyId
                })
            });
            if (!res.ok) throw new Error('Error enviando plantilla');
            setShowTemplates(false);
        } catch (error) {
            alert('Error al enviar plantilla');
            console.error(error);
        }
    };

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
            {/* Header de Asignación - Visible solo si es Lead */}
            <div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">{contactId}</span>
                    {isLead && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Lead</span>}
                </div>
                {/* Solo mostrar asignación si NO es el asistente (es decir, si es admin) */}
                {isLead && role !== 'assistant_humano' && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Asignar a:</span>
                        <select
                            className="text-sm border rounded px-2 py-1 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={assignedTo || ''}
                            onChange={(e) => handleAssign(e.target.value)}
                            disabled={loadingAssign}
                        >
                            <option value="">-- Sin asignar --</option>
                            {assistants.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.email}
                                </option>
                            ))}
                        </select>
                        {loadingAssign && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    </div>
                )}
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

                {/* Modal de Plantillas */}
                {showTemplates && (
                    <div className="absolute bottom-full left-0 w-full md:w-96 bg-white border rounded-t-lg shadow-xl max-h-96 flex flex-col z-20">
                        <div className="flex justify-between items-center p-3 border-b bg-gray-50 rounded-t-lg">
                            <h3 className="font-medium text-gray-700">Seleccionar Plantilla</h3>
                            <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2">
                            {loadingTemplates ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : templates.length === 0 ? (
                                <p className="text-center text-gray-500 p-4">No hay plantillas disponibles.</p>
                            ) : (
                                <div className="space-y-1">
                                    {templates.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleSendTemplate(t)}
                                            className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm group border-b border-gray-100 last:border-0"
                                        >
                                            <div className="font-medium text-gray-800 group-hover:text-blue-600">{t.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{t.components?.find((c: any) => c.type === 'BODY')?.text || 'Sin texto previo'}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => {
                            if (!showTemplates) fetchTemplates();
                            setShowTemplates(!showTemplates);
                        }}
                        className={`shrink-0 ${showTemplates ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                        title="Enviar Plantilla"
                    >
                        <FileText className="h-4 w-4" />
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