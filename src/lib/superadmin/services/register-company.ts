import { supabase } from '@/lib/supabase/server.supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { CompanyEmailService } from '@/lib/email/services/company-email.service';

export async function registerCompany(email: string, password: string, companyName: string, whatsappNumber: string) {
    const emailService = new CompanyEmailService();
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
        email_confirm: false,
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

    // 5. Enviar email de verificación usando nuestro servicio personalizado
    // const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email/${verificationToken}`;
    try {
        const emailSent = await emailService.sendCompanyVerificationEmail(
            email,
            companyName,
            verificationToken
        );

        if(!emailSent) {
            console.error('Error al enviar email de verificación');
            // No fallar el registro si el email no se envía, pero loguear el error
        }

    } catch (emailError) {
        console.log('Error al enviar email de verificación:', emailError);
    }

    return NextResponse.json({
        success: true,
        message: 'Empresa creada. Por favor revisa tu correo para verificar tu email.'
    });
}