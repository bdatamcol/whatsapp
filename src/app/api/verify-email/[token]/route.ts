import { supabase } from '@/lib/supabase/server.supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;

        // Buscar empresa por token de verificación
        const { data: company, error } = await supabase
            .from('companies')
            .select('id, email')
            .eq('verification_token', token)
            .maybeSingle();

        if (error || !company) {
            return NextResponse.json(
                { error: 'Token de verificación inválido' },
                { status: 400 }
            );
        }

        // Actualizar estado de verificación
        await supabase
            .from('companies')
            .update({
                email_verified: true,
                verification_token: null,
                is_active: true
            })
            .eq('id', company.id);

        // Confirmar email del usuario en Supabase Auth
        await supabase.auth.admin.updateUserById(
            company.id,
            { email_confirm: true }
        );

        return NextResponse.redirect(new URL('/login?verified=true', request.url));

    } catch (error) {
        console.error('Error en verificación:', error);
        return NextResponse.json(
            { error: 'Error al verificar email' },
            { status: 500 }
        );
    }
}