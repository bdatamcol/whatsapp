import { supabase } from '@/lib/supabase/server.supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function registerCompany(email: string, password: string, companyName: string, whatsappNumber: string) {
    // Generar token de verificación único
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 1. Crear la empresa (sin activar aún)
    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
            name: companyName,
            whatsapp_number: whatsappNumber,
            is_active: false, // No activar hasta verificar email
            email_verified: false,
            verification_token: verificationToken
        })
        .select()
        .maybeSingle();

    if (companyError || !companyData) {
        return NextResponse.json({ error: 'Error creando empresa' }, { status: 500 });
    }

    // 2. Crear usuario en Supabase Auth (sin confirmar email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Cambiado de true a false
    });

    if (authError || !authData.user) {
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 });
    }

    const userId = authData.user.id;

    // 3. Actualizar empresa con el ID del admin
    await supabase
        .from('companies')
        .update({ admin_user_id: userId })
        .eq('id', companyData.id);

    // 4. Crear perfil para el usuario
    const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email,
        role: 'admin',
        company_id: companyData.id,
    });

    if (profileError) {
        return NextResponse.json({ error: 'Error creando perfil' }, { status: 500 });
    }

    // 5. Enviar email de verificación (configurar en Supabase)
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email/${verificationToken}`;

    // Aquí deberías usar el servicio de email de Supabase o un servicio externo
    // Ejemplo con Supabase Edge Functions:
    await supabase.functions.invoke('send-verification-email', {
        body: { email, companyName, verificationUrl }
    });

    return NextResponse.json({
        success: true,
        message: 'Empresa creada. Por favor revisa tu correo para verificar tu email.'
    });
}