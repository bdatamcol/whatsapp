'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

function timeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'justo ahora';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
}

export default function AssignmentsPage() {
    const [contacts, setContacts] = useState([]);
    const [assistants, setAssistants] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let contactsChannel = null;
        let assignmentsChannel = null;

        const loadData = async () => {
            setLoading(true);
            const userData = await getCurrentUserClient();
            setUser(userData);

            const { data: contactsData } = await supabase
                .from('contacts')
                .select(`phone, name, created_at, last_interaction_at, needs_human, assignments:assistants_assignments!left(id, assigned_to, assigned_at, active, profile:assigned_to (email))`)
                .eq('needs_human', true)
                .eq('company_id', userData.company_id);

            const { data: assistantsData } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('role', 'assistant')
                .eq('company_id', userData.company_id);

            setContacts(contactsData || []);
            setAssistants(assistantsData || []);
            setLoading(false);
        };

        loadData();

        contactsChannel = supabase
            .channel('realtime-contacts')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts' }, loadData)
            .subscribe();

        assignmentsChannel = supabase
            .channel('realtime-assignments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assistants_assignments' }, loadData)
            .subscribe();

        return () => {
            if (contactsChannel) supabase.removeChannel(contactsChannel);
            if (assignmentsChannel) supabase.removeChannel(assignmentsChannel);
        };
    }, []);

    const handleAssign = async (phone, assistantId) => {
        const res = await fetch('/api/admin/assign-contact', {
            method: 'POST',
            body: JSON.stringify({ phone, assistantId, adminId: user.id }),
        });

        if (res.ok) {
            toast.success('Asignación exitosa');
        } else {
            const data = await res.json();
            toast.error(data.message);
        }
    };

    const unassigned = contacts.filter(c => !c.assignments?.some(a => a.active));
    const assigned = contacts.filter(c => c.assignments?.some(a => a.active));

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Contactos por asignar */}
            <Card>
                <CardHeader><CardTitle>Contactos por asignar</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {unassigned.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No hay contactos esperando atención</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="text-left p-2">Nombre</th>
                                    <th className="text-left p-2">Teléfono</th>
                                    <th className="text-left p-2">Espera</th>
                                    <th className="text-left p-2">Asignar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unassigned.map(c => (
                                    <tr key={c.phone} className="border-b hover:bg-accent/30">
                                        <td className="p-2">{c.name || 'Sin nombre'}</td>
                                        <td className="p-2">{c.phone}</td>
                                        <td className="p-2 text-muted-foreground">{timeAgo(c.last_interaction_at || c.created_at)}</td>
                                        <td className="p-2">
                                            <Select onValueChange={(value) => handleAssign(c.phone, value)}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Asignar a..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {assistants.map(a => (
                                                        <SelectItem key={a.id} value={a.id}>{a.email}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Contactos asignados */}
            <Card>
                <CardHeader><CardTitle>Contactos asignados</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {assigned.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No hay contactos asignados actualmente</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="text-left p-2">Nombre</th>
                                    <th className="text-left p-2">Teléfono</th>
                                    <th className="text-left p-2">Asignado a</th>
                                    <th className="text-left p-2">Desde</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assigned.map(c => {
                                    const a = c.assignments.find(a => a.active);
                                    return (
                                        <tr key={c.phone} className="border-b hover:bg-accent/30">
                                            <td className="p-2">{c.name || 'Sin nombre'}</td>
                                            <td className="p-2">{c.phone}</td>
                                            <td className="p-2">{a?.profile?.email || 'Desconocido'}</td>
                                            <td className="p-2 text-muted-foreground">{timeAgo(a?.assigned_at)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
