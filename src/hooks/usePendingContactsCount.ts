'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';

export function usePendingContactsCount() {
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        const user = await getCurrentUserClient();
        if (!user?.company_id) return;
        const { data, error } = await supabase
            .from('contacts')
            .select(`
        phone,
        needs_human,
        company_id,
        assignments:assistants_assignments!left(contact_phone, active)
      `)
            .eq('company_id', user.company_id);

        if (!error && data) {
            // Filtrar solo los contactos que necesitan humano y no están asignados activamente
            const filtered = data.filter((c: any) => {
                const activeAssignment = c.assignments?.some((a: any) => a.active && a.company_id === user.company_id);
                return c.needs_human && !activeAssignment;
            });

            setCount(filtered.length);
        }
    };

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;

        fetchCount();

        channel = supabase
            .channel('contacts-needs-human-or-assignments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'contacts',
                },
                fetchCount
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assistants_assignments',
                },
                fetchCount
            )
            .subscribe();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    return count;
}
