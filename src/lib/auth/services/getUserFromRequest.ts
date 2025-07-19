import { supabase } from '@/lib/supabase/client.supabase';

export async function getCurrentUserClient() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
    if (profileError || !profile) return null;


    return {
        ...user,
        role: profile.role,
        email: profile.email,
        company_id: profile.company_id
    };
}

