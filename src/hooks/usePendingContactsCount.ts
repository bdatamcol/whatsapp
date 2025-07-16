'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';

export function usePendingContactsCount() {
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        const { data, error } = await supabase
            .from('contacts')
            .select(`
        phone,
        needs_human,
        assignments:assistants_assignments!left(contact_phone, active)
      `);

        if (!error && data) {
            // Filtrar solo los contactos que necesitan humano y no están asignados activamente
            const filtered = data.filter((c: any) => {
                const activeAssignment = c.assignments?.some((a: any) => a.active);
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
