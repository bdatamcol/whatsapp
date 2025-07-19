import { NextResponse } from 'next/server';
import { supabase } from '../supabase/server.supabase';


export async function registerAssistant(email: string, password: string, companyId: string) {

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

    // 3. Crear perfil como asistente
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            email,
            role: 'assistant',
            company_id: companyId,
        });

    if (profileError) {
        return NextResponse.json({ error: 'Error creando perfil' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

}