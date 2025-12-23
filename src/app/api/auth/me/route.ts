import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const cookieStore = cookies();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_ROLE_KEY! // aquí SÍ es válido
        );

        let token = (await cookieStore).get('sb-access-token')?.value;
        const refreshToken = (await cookieStore).get('sb-refresh-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
        }

        // Verificar usuario
        let { data: { user }, error } = await supabase.auth.getUser(token);

        // Intentar refresh
        if (error || !user) {
            if (!refreshToken) {
                return NextResponse.json({ error: 'session_expired' }, { status: 401 });
            }

            const { data, error: refreshError } =
                await supabase.auth.refreshSession({
                    refresh_token: refreshToken,
                });

            if (refreshError || !data.session) {
                return NextResponse.json({ error: 'session_invalid' }, { status: 401 });
            }

            user = data.session.user;
            token = data.session.access_token;

            const response = NextResponse.next();
            response.cookies.set('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
            });
            response.cookies.set('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
            });
        }

        // Obtener perfil
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role, is_active')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.is_active) {
            return NextResponse.json({ error: 'profile_inactive' }, { status: 403 });
        }

        // Verificar empresa (excepto superadmin)
        if (profile.role !== 'superadmin' && profile.company_id) {
            const { data: company } = await supabase
                .from('companies')
                .select('is_active, email_verified')
                .eq('id', profile.company_id)
                .single();

            if (!company || !company.is_active || !company.email_verified) {
                return NextResponse.json(
                    { error: 'company_not_verified' },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
            },
            profile,
        });

    } catch (error) {
        console.error('auth/me error:', error);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
