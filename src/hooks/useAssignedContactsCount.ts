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

            const { count: newCount, error } = await supabase
                .from('assistants_assignments')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .eq('company_id', user.company_id)
                .eq('active', true);

            if (!error && typeof newCount === 'number') {
                setCount(newCount);
                console.log('📊 Contador actualizado:', newCount);
            }
        };

        const setupRealtime = async () => {
            const user = await getCurrentUserClient();
            if (!user?.id || !user?.company_id) return;

            // Cargar conteo inicial
            await fetchCount();

            // Configurar suscripción real-time con filtros separados
            channel = supabase
                .channel(`assignment-count-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'assistants_assignments',
                        filter: `assigned_to=eq.${user.id}`,
                    },
                    fetchCount
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'assistants_assignments',
                        filter: `assigned_to=eq.${user.id}`,
                    },
                    (payload) => {
                        // Solo actualizar si cambia el estado 'active'
                        if (payload.new.active !== payload.old.active) {
                            fetchCount();
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'assistants_assignments',
                        filter: `assigned_to=eq.${user.id}`,
                    },
                    fetchCount
                )
                .subscribe((status) => {
                    console.log('Estado del canal real-time:', status);
                });
        };

        setupRealtime();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    return count;
}
