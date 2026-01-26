'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useEffect, useState } from 'react';

interface Conversation {
    phone: string;
    name: string;
    avatar_url: string;
    lastMessage: { role: string; content: string } | null;
    updated_at: string;
    tags?: string[];
    status?: string;
}

interface Props {
    companyId: string; // 👈 nuevo
    onSelectAction: (data: { phone: string; companyId: string }) => void;
}

export default function ConversationList({ companyId, onSelectAction }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filter, setFilter] = useState<'all' | 'lead'>('all');

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
        <div className="h-full flex flex-col">
             <div className="p-4 border-b">
                 <h2 className="text-xl font-semibold">Chats</h2>
                 <div className="flex gap-2 mt-2">
                     <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'all'
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                             }`}
                     >Todos</button>
                     <button onClick={() => setFilter('lead')} className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'lead'
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                             }`}
                     >Leads</button>
                 </div>
             </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                 {conversations.length === 0 && (
                     <p className="text-gray-500">No hay chats disponibles.</p>
                 )}
                 {conversations
                     .filter(c => {
                         if (filter === 'lead') return c.tags?.includes('lead') || c.status === 'lead';
                         return true;
                     })
                     .map(({ phone, name, avatar_url, lastMessage, updated_at, tags }) => (
                     <div
                         key={phone}
                         onClick={() => onSelectAction({ phone, companyId })}
                         className="flex items-center gap-3 bg-white p-3 rounded-lg shadow hover:bg-gray-100 transition cursor-pointer relative"
                     >
                         {/* Tag Badge */}
                         {tags?.includes('lead') && (
                             <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full" title="Lead"></span>
                         )}

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
         </div>
     );

}