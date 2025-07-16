import { supabase } from '@/lib/supabase/server.supabase';
import { NextResponse } from 'next/server';


export async function registerCompany(email: string, password: string, companyName: string) {

    // 1. Crear la empresa
    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName })
        .select()
        .maybeSingle();

    if (companyError || !companyData) {
        return NextResponse.json({ error: 'Error creando empresa' }, { status: 500 });
    }

    // 2. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 });
    }

    const userId = authData.user.id;

    // 3. Crear perfil para el usuario
    const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email,
        role: 'admin',
        company_id: companyData.id,
    });

    if (profileError) {
        return NextResponse.json({ error: 'Error creando perfil' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}