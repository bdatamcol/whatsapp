'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';

type Contact = {
    phone: string;
    name: string;
    status: string;
};

type Assistant = {
    id: string;
    email: string;
};

export default function AssignmentsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const userData = await getCurrentUserClient();
            setUser(userData);

            const { data: contactsData } = await supabase
                .from('contacts')
                .select('phone, name, status')
                .eq('needs_human', true);

            const { data: assistantsData } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('role', 'assistant');
                
                setContacts(contactsData || []);
                setAssistants(assistantsData || []);
                setLoading(false);
                console.log({assistantsData});
            };
            loadData();
    }, []);
    const handleAssign = async (phone: string, assistantId: string) => {
        console.log({phone, assistantId});
        console.log(user.id);
        const res = await fetch('/api/admin/assign-contact', {
            method: 'POST',
            body: JSON.stringify({
                phone,
                assistantId,
                adminId: user.id,
            }),
        });

        if (res.ok) {
            alert('Asignado correctamente');
            setContacts(prev => prev.filter(c => c.phone !== phone)); // remover de la lista
        } else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    };

    if (loading) return <p className="p-4">Cargando...</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Asignación de clientes a asistentes</h1>

            {contacts.length === 0 ? (
                <p>No hay contactos esperando atención humana.</p>
            ) : (
                <table className="w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border">Nombre</th>
                            <th className="p-2 border">Teléfono</th>
                            <th className="p-2 border">Asignar a</th>
                            <th className="p-2 border">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(contact => (
                            <tr key={contact.phone}>
                                <td className="p-2 border">{contact.name}</td>
                                <td className="p-2 border">{contact.phone}</td>
                                <td className="p-2 border">
                                    <select
                                        onChange={e => handleAssign(contact.phone, e.target.value)}
                                        defaultValue=""
                                        className="border p-1"
                                    >
                                        <option value="" disabled>
                                            Seleccionar...
                                        </option>
                                        {assistants.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.email}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border text-center">
                                    {/* Acción se ejecuta al seleccionar opción */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
