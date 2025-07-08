import { supabase } from '@/lib/supabase/server.supabase';

export async function registerAdmin(email: string, password: string) {
    if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError) throw new Error(authError.message);

    const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: email,
        role: 'admin',
    });

    if (profileError) throw new Error(profileError.message);

    return authData.user;
}
