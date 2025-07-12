'use client'

import { useParams } from 'next/navigation';
import ChatView from '@/app/components/whatsapp/ChatView';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ChatPage() {
    const params = useParams();
    const contactId = params.contactId as string;
    const [loading, setLoading] = useState(false);

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
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!contactId) return <p>Cargando...</p>;

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
            <ChatView contactId={contactId} role="assistant_humano" />
        </div>
    );
}
