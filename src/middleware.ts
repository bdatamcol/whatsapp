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
        let token = request.cookies.get('sb-access-token')?.value;
        let refreshToken = request.cookies.get('sb-refresh-token')?.value;

        if (!token) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('sb-access-token');
            response.cookies.delete('sb-refresh-token');
            return response;
        }

        // Verificar token
        let { data: { user }, error } = await supabase.auth.getUser(token);

        // Intentar refrescar token si está disponible
        if (error || !user) {
            if (refreshToken) {
                try {
                    const { data, error: refreshError } = await supabase.auth.refreshSession({
                        refresh_token: refreshToken
                    });

                    if (refreshError || !data.session) {
                        throw refreshError || new Error('No session after refresh');
                    }

                    // ACTUALIZAR la variable user con el nuevo usuario
                    user = data.session.user;
                    token = data.session.access_token;
                    
                    // Actualizar cookies con nuevos tokens
                    const newResponse = NextResponse.next();
                    newResponse.cookies.set('sb-access-token', data.session.access_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 * 7 // 7 días
                    });
                    newResponse.cookies.set('sb-refresh-token', data.session.refresh_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 * 30 // 30 días
                    });

                    // Continuar con el nuevo usuario
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('company_id, role, is_active')
                        .eq('id', user.id)
                        .single();

                    if (!profile || !profile.is_active) {
                        const response = NextResponse.redirect(new URL('/login', request.url));
                        response.cookies.delete('sb-access-token');
                        response.cookies.delete('sb-refresh-token');
                        return response;
                    }

                    // Verificar permisos de ruta según rol
                    if (request.nextUrl.pathname === '/') {
                        const redirectPath =
                            profile.role === 'admin' ? '/dashboard' :
                                profile.role === 'assistant' ? '/assistant/dashboard' :
                                    profile.role === 'superadmin' ? '/superadmin-dashboard' : '/login';

                        return NextResponse.redirect(new URL(redirectPath, request.url));
                    }

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

                    return newResponse;
                    
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

        // Si llegamos aquí, user tiene valor válido
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role, is_active')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.is_active) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('sb-access-token');
            response.cookies.delete('sb-refresh-token');
            return response;
        }

        // CORREGIDO: Los superadmins no necesitan verificación de empresa
        if (profile.role !== 'superadmin') {
            // Solo verificar empresa para roles que no sean superadmin
            if (profile.company_id) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('is_active, email_verified')
                    .eq('id', profile.company_id)
                    .single();

                if (!company || !company.is_active || !company.email_verified) {
                    const response = NextResponse.redirect(new URL('/login?error=email_not_verified', request.url));
                    response.cookies.delete('sb-access-token');
                    response.cookies.delete('sb-refresh-token');
                    return response;
                }
            }
        } else {
            console.log('Middleware - Superadmin detectado - saltando verificación de empresa');
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
                console.log('Middleware - Acceso denegado a superadmin-dashboard, rol:', profile.role);
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } else if (request.nextUrl.pathname.startsWith('/assistant/dashboard')) {
            if (profile.role !== 'assistant' && profile.role !== 'admin') {
                console.log('Middleware - Acceso denegado a assistant/dashboard, rol:', profile.role);
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } else if (request.nextUrl.pathname.startsWith('/dashboard')) {
            if (profile.role !== 'admin' && profile.role !== 'superadmin') {
                console.log('Middleware - Acceso denegado a dashboard, rol:', profile.role);
                return NextResponse.redirect(new URL('/login', request.url));
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