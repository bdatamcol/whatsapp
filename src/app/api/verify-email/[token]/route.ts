import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        
        console.log('=== VERIFICANDO EMAIL ===');
        console.log('Token:', token);

        if (!token) {
            return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
        }

        // Buscar la empresa con el token
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('verification_token', token.trim())
            .maybeSingle();

        if (companyError || !company) {
            console.log('Token no encontrado');
            return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
        }

        console.log('Empresa:', company.name, 'ID:', company.id);

        // 1. Actualizar la empresa (si aún no está verificada)
        if (!company.email_verified) {
            const { error: updateError } = await supabase
                .from('companies')
                .update({
                    email_verified: true,
                    verification_token: null,
                    is_active: true,
                })
                .eq('id', company.id);

            if (updateError) {
                console.log('Error al actualizar empresa:', updateError);
                return NextResponse.redirect(new URL('/login?error=update_failed', request.url));
            }
        }

        // 2. Buscar el perfil asociado a esta empresa
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', company.id)
            .maybeSingle();

        if (profileError || !profile) {
            console.log('No se encontró perfil para esta empresa');
            return NextResponse.redirect(new URL('/login?error=no_profile', request.url));
        }

        console.log('Perfil encontrado:', profile.email, 'ID:', profile.id);

        // 3. Confirmar el email del usuario auth
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        console.log('authUsers:', authUsers);
        const authUser = authUsers?.users?.find((u: any) => u.email === profile.email);

        if (authUser) {
            console.log('Usuario auth encontrado:', authUser.id);
            
            // CONFIRMAR el email
            const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
                authUser.id,
                { email_confirm: true }
            );

            if (authUpdateError) {
                console.log('Error al confirmar email:', authUpdateError);
            } else {
                console.log('✅ Email confirmado en auth.users');
            }

            // 4. Actualizar perfil si es necesario
            if (!profile.company_id) {
                await supabase
                    .from('profiles')
                    .update({ company_id: company.id })
                    .eq('id', profile.id);
            }
        }

        // Redirigir con éxito
        return NextResponse.redirect(
            new URL(`/login?verified=true&email=${encodeURIComponent(profile.email)}`, request.url)
        );

    } catch (error) {
        console.log('Error:', error);
        return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
}