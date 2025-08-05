'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useEffect, useState } from 'react';

interface Conversation {
    phone: string;
    name: string;
    avatar_url: string;
    lastMessage: { role: string; content: string } | null;
    updated_at: string;
}

interface Props {
    companyId: string; // 👈 nuevo
    onSelectAction: (data: { phone: string; companyId: string }) => void;
}

export default function ConversationList({ companyId, onSelectAction }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    // Cargar inicialmente
    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        const res = await fetch(`/api/whatsapp/conversations?companyId=${companyId}`);
        const data = await res.json();

        if (Array.isArray(data)) {
            setConversations(data); // ya vendrán filtradas del backend
        } else {
             // Respuesta inesperada del servidor
             setConversations([]);
         }
    };

    // Escuchar cambios en la tabla
    useEffect(() => {
        const channel = supabase
            .channel('conversations_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                },
                () => {
                    fetchConversations(); // 🔁 actualiza la vista en tiempo real
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="space-y-4 p-4">
            <h2 className="text-xl font-semibold mb-4">Chats</h2>
            {conversations.length === 0 && (
                <p className="text-gray-500">No hay chats disponibles.</p>
            )}
            {conversations.map(({ phone, name, avatar_url, lastMessage, updated_at }) => (
                <div
                    key={phone}
                    onClick={() => onSelectAction({ phone, companyId })}
                    className="flex items-center gap-3 bg-white p-3 rounded-lg shadow hover:bg-gray-100 transition cursor-pointer"
                >
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {avatar_url ? (
                            <img
                                src={avatar_url}
                                alt={name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-600 font-bold text-lg">
                                {name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Información del chat */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{name}</h3>
                            <span className="text-xs text-gray-400">
                                {new Date(updated_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm truncate">
                            {lastMessage?.content ? lastMessage.content.slice(0, 80) + '…' : 'No hay mensajes'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

}