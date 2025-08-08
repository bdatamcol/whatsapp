import { supabase } from '@/lib/supabase/server.supabase';

export async function getAssistantList(user: { id: string }) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

    if (!profile?.company_id) {
        throw new Error('Empresa no encontrada');
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, created_at, is_active') // Add is_active
        .eq('role', 'assistant')
        .eq('company_id', profile.company_id)
        .is('deleted_at', null) // Filter out soft deleted
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
