// src/lib/auth/services/getUserProfile.ts
import { supabase } from '@/lib/supabase/server.supabase';
import { cookies } from 'next/headers';

export async function getUserProfile(req?: Request) {
    const cookieStore = cookies();
    const access_token = (await cookieStore).get('sb-access-token')?.value;

    if (!access_token) return null;

    const { data: { user } } = await supabase.auth.getUser(access_token);
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    return profile;
}
