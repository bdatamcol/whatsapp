'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';

export function useAssignedContactsCount() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;

        const fetchCount = async () => {
            const user = await getCurrentUserClient();
            if (!user?.id || !user?.company_id) return;

            const { count, error } = await supabase
                .from('assistants_assignments')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('company_id', user.company_id)
                .eq('active', true);

            if (!error && typeof count === 'number') {
                setCount(count);
            }

            // Suscripción en tiempo real a INSERTS y DELETES o UPDATES que afecten "active"
            channel = supabase
                .channel(`assignment-count-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'assistants_assignments',
                        filter: `assigned_to=eq.${user.id},company_id=eq.${user.company_id}`,
                    },
                    fetchCount
                )
                .subscribe();
        };

        fetchCount();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    return count;
}
