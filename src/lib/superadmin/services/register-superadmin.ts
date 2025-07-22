import { supabase } from '@/lib/supabase/server.supabase';
import { NextResponse } from 'next/server';

export async function registerSuperadmin(email: string, password: string) {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        return NextResponse.json({ error: 'Error creando usuario superadmin' }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Crear perfil como superadmin
    const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email,
        role: 'superadmin',
        // No se asigna company_id ya que el superadmin no pertenece a ninguna empresa específica
    });

    if (profileError) {
        console.log('Error creando perfil de superadmin:', profileError);
        return NextResponse.json({ error: 'Error creando perfil de superadmin' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}