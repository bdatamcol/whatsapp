import { supabase } from '@/lib/supabase/server.supabase';

export async function upsertContact({
    phone,
    name,
    avatar_url,
    status,
    last_interaction_at,
}: {
    phone: string;
    name: string;
    avatar_url: string;
    status?: string;
    last_interaction_at?: string;
}) {
    const { error } = await supabase
        .from('contacts')
        .upsert({ phone, name, avatar_url, status, last_interaction_at }, { onConflict: 'phone' });

    if (error) {
        console.error('Error al guardar el contacto:', error.message);
    }
}

