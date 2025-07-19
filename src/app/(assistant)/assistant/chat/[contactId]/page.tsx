'use client';

import { useParams, useRouter } from 'next/navigation';
import ChatView from '@/app/components/whatsapp/ChatView';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client.supabase';

export default function ChatPage() {
    const params = useParams();
    const contactId = params.contactId as string;
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleReturnToIA = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/assistant/return-to-ia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: contactId }),
            });

            const result = await res.json();

            if (res.ok) {
                toast.success('IA reactivada para este contacto');
                router.push('/assistant/dashboard');
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchCompanyId = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('company_id')
                .eq('phone', contactId)
                .maybeSingle();

            if (error) {
                console.error('Error consultando company_id:', error.message);
                toast.error('Error al obtener la empresa del contacto');
                setLoading(false);
                return;
            }

            if (data?.company_id) {
                setCompanyId(data.company_id);
            } else {
                toast.warning('Este contacto aún no está asociado a una empresa');
            }

            setLoading(false);
        };

        if (contactId) {
            fetchCompanyId();
        }
    }, [contactId]);

    if (!contactId || loading || !companyId) return <p className="p-4">Cargando...</p>;

    return (
        <div className="flex flex-col h-screen">
            <div className="p-4 border-b bg-white flex justify-between items-center">
                <h2 className="text-xl font-semibold">Chat con {contactId}</h2>
                <button
                    onClick={handleReturnToIA}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Actualizando...' : 'Devolver a IA'}
                </button>
            </div>

            <ChatView
                contactId={contactId}
                role="assistant_humano"
                companyId={companyId}
            />
        </div>
    );
}
