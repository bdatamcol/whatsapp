'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import ConversationList from './ConversationList';
import ChatView from './ChatView';

export default function WhatsAppPanel() {
    const [selectedContact, setSelectedContact] = useState<{
        phone: string;
        companyId: string;
    } | null>(null);

    const [companyIdActual, setCompanyIdActual] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanyId = async () => {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (error || !data?.company_id) {
                // Error obteniendo company_id del perfil
            } else {
                setCompanyIdActual(data.company_id);
            }

            setLoading(false);
        };

        fetchCompanyId();
    }, []);

    if (loading) {
        return <div className="p-4">Cargando usuario...</div>;
    }

    if (!companyIdActual) {
        return <div className="p-4 text-red-500">No estás asociado a ninguna empresa.</div>;
    }

    return (
        <div className="flex h-full">
            {/* Lista de chats */}
            <aside className="w-[40%] border-r bg-white overflow-y-auto">
                <ConversationList
                    companyId={companyIdActual}
                    onSelectAction={({ phone }) =>
                        setSelectedContact({ phone, companyId: companyIdActual })
                    }
                />
            </aside>

            {/* Vista del chat */}
            <main className="flex-1 bg-gray-50 overflow-y-auto">
                {selectedContact ? (
                    <ChatView
                        contactId={selectedContact.phone}
                        companyId={selectedContact.companyId}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Selecciona un chat para empezar
                    </div>
                )}
            </main>
        </div>
    );
}
