'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { SelectValue } from '@radix-ui/react-select';
import { toast } from 'sonner';

type Contact = {
    phone: string;
    name: string;
    status: string;
    assignments: any[];
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

            const { data: contactsData, error } = await supabase
                .from('contacts')
                .select(`phone, name, status, assignments:assistants_assignments!left(id, assigned_to, active, profile:assigned_to (email))`)
                .eq('needs_human', true);

            const { data: assistantsData } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('role', 'assistant');

            setContacts(contactsData || []);
            setAssistants(assistantsData || []);
            setLoading(false);
        };
        loadData();
    }, []);
    const handleAssign = async (phone: string, assistantId: string) => {
        const res = await fetch('/api/admin/assign-contact', {
            method: 'POST',
            body: JSON.stringify({
                phone,
                assistantId,
                adminId: user.id,
            }),
        });

        if (res.ok) {
            const assignedAssistant = assistants.find(a => a.id === assistantId);
            setContacts(prev =>
                prev.map(c =>
                    c.phone === phone
                        ? {
                            ...c,
                            assignments: [
                                {
                                    assigned_to: assistantId,
                                    profile: { email: assignedAssistant?.email || 'desconocido' },
                                },
                            ],
                        }
                        : c
                )
            );
            toast.success('Asignación exitosa');
        } else {
            const data = await res.json();
            toast.error(data.message);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Asignación de clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {contacts.map(contact => {
                        const assigned = contact.assignments?.find(a => a.active);
                        const alreadyAssigned = !!assigned;

                        return (
                            <div key={contact.phone} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">{contact.name}</p>
                                    <p className="text-sm text-muted-foreground">{contact.phone}</p>

                                    {alreadyAssigned && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Ya asignado a: {assigned.profile.email}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    {alreadyAssigned ? (
                                        <span className="text-sm text-muted-foreground">Asignado</span>
                                    ) : (
                                        <Select onValueChange={(value) => handleAssign(contact.phone, value)}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Asignar a..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {assistants.map(a => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
