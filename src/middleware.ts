import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const publicRoutes = [
        '/login',
        '/_next/static',
        '/_next/image',
        '/favicon.ico',
        '/_next/webpack-hmr',
        '/api/auth',
        '/api/health',
    ];

    const isPublicRoute = publicRoutes.some(route => 
        request.nextUrl.pathname.startsWith(route)
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    try {
        // Crear cliente Supabase para server
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_ROLE_KEY!
        );

        // Obtener token de cookies
        const token = request.cookies.get('sb-access-token')?.value;
        const refreshToken = request.cookies.get('sb-refresh-token')?.value;

        if (!token) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('sb-access-token');
            response.cookies.delete('sb-refresh-token');
            return response;
        }

        // Verificar token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            // Intentar refrescar token si está disponible
            if (refreshToken) {
                try {
                    const { data, error: refreshError } = await supabase.auth.refreshSession({
                        refresh_token: refreshToken
                    });

                    if (refreshError || !data.session) {
                        throw refreshError || new Error('No session after refresh');
                    }

                    // Token refrescado exitosamente, continuar
                    const newResponse = NextResponse.next();
                    newResponse.cookies.set('sb-access-token', data.session.access_token);
                    newResponse.cookies.set('sb-refresh-token', data.session.refresh_token);
                    
                    // Continuar con la verificación de empresa
                } catch (refreshError) {
                    const response = NextResponse.redirect(new URL('/login', request.url));
                    response.cookies.delete('sb-access-token');
                    response.cookies.delete('sb-refresh-token');
                    return response;
                }
            } else {
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('sb-access-token');
                response.cookies.delete('sb-refresh-token');
                return response;
            }
        }

        // Verificar perfil y empresa
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('sb-access-token');
            response.cookies.delete('sb-refresh-token');
            return response;
        }

        // Redirigir desde raíz según rol
        if (request.nextUrl.pathname === '/') {
            const redirectPath =
                profile.role === 'admin' ? '/dashboard' :
                profile.role === 'assistant' ? '/assistant/dashboard' :
                profile.role === 'superadmin' ? '/superadmin-dashboard' : '/login';

            return NextResponse.redirect(new URL(redirectPath, request.url));
        }

        // Verificar permisos de ruta según rol
        if (request.nextUrl.pathname.startsWith('/superadmin-dashboard')) {
            if (profile.role !== 'superadmin') {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } else if (request.nextUrl.pathname.startsWith('/assistant/dashboard')) {
            if (profile.role !== 'assistant' && profile.role !== 'admin') {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } else if (request.nextUrl.pathname.startsWith('/dashboard')) {
            if (profile.role !== 'admin' && profile.role !== 'superadmin') {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }

        // Verificar estado de la empresa para usuarios no superadmin
        if (profile.role !== 'superadmin' && profile.company_id) {
            const { data: company } = await supabase
                .from('companies')
                .select('is_active')
                .eq('id', profile.company_id)
                .single();

            if (!company || !company.is_active) {
                // Empresa desactivada, cerrar sesión inmediatamente
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('sb-access-token');
                response.cookies.delete('sb-refresh-token');
                return response;
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware error:', error);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|login).*)'],
};