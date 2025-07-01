'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useEffect, useState } from 'react';

interface Conversation {
    phone: string;
    lastMessage: { role: string; content: string } | null;
    updated_at: string;
}

interface Props {
    onSelectAction: (phone: string) => void;
}

export default function ConversationList({ onSelectAction }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    // Cargar inicialmente
    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        const res = await fetch('/api/whatsapp/conversations');
        const data = await res.json();
        setConversations(data);
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
            {conversations.map(({ phone, lastMessage, updated_at }) => (
                <div
                    key={phone}
                    onClick={() => onSelectAction(phone)}
                    className="bg-white p-3 rounded shadow hover:bg-gray-100 transition cursor-pointer"
                >
                    <div className="font-bold text-sm text-gray-800">{phone}</div>
                    <div className="text-gray-600 text-sm">
                        {lastMessage?.content ? lastMessage?.content.slice(0, 100)+'...'  : 'No hay mensajes'}
                    </div>
                    <div className="text-xs text-gray-400">
                        {new Date(updated_at).toLocaleTimeString([], {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}