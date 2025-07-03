import { supabase } from '@/lib/supabase/server.supabase';

export async function upsertContact({
    phone,
    name,
    avatar_url,
}: {
    phone: string;
    name: string;
    avatar_url: string;
}) {
    const { error } = await supabase
        .from('contacts')
        .upsert({ phone, name, avatar_url }, { onConflict: 'phone' });

    if (error) {
        console.error('Error al guardar el contacto:', error.message);
    }
}

