'use client';

import { useParams, useRouter } from 'next/navigation';
import ChatView from '@/app/components/whatsapp/ChatView';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client.supabase';

export default function ChatPage() {
    const params = useParams();
    // Decodificar el contactId para evitar %2B en lugar de +
    const contactId = decodeURIComponent(params.contactId as string);
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
                body: JSON.stringify({ phone: contactId, companyId }),
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
            // Primero obtener el company_id del perfil del asistente
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('Usuario no autenticado');
                toast.error('Usuario no autenticado');
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!profile?.company_id) {
                console.error('Perfil sin empresa asociada');
                toast.error('No estás asociado a ninguna empresa');
                setLoading(false);
                return;
            }

            const companyId = profile.company_id;

            // ASIGNACIÓN DIRECTA:
            // Obviamos la verificación de si existe en 'conversations' o 'contacts'.
            // Si el asistente tiene una empresa, asumimos que puede gestionar este número (contactId).
            setCompanyId(companyId);

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
