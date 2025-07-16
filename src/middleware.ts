import { supabase } from '@/lib/supabase/server.supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// El middleware actual está bien configurado para verificar la cookie 'sb-access-token'
// Solo asegúrate de que las rutas públicas incluyan todos los recursos necesarios

export async function middleware(request: NextRequest) {
    const publicRoutes = [
        '/login',
        '/_next/static',
        '/api/',
        '/favicon.ico',
        '/_next/image',  // Agregamos esta ruta para imágenes
        '/_next/webpack-hmr'  // Agregamos esta ruta para desarrollo
    ];

    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    // Si es una ruta pública, permitir el acceso
    if (isPublicRoute) {
        return NextResponse.next();
    }

    try {
        // Obtener el token de la cookie
        const token = request.cookies.get('sb-access-token')?.value;
        if (!token) {
            // Si no hay token, redirigir al login
            const redirectUrl = new URL('/login', request.url);
            return NextResponse.redirect(redirectUrl);
        }

        // Verificar el token con Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        // Token válido, redirigir a dashboard si está en `/`
        if (request.nextUrl.pathname === '/') {
            // Traer el perfil del usuario
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            const redirectPath =
                profile?.role === 'admin'
                    ? '/dashboard'
                    : profile?.role === 'assistant'
                        ? '/assistant/dashboard'
                        : '/login';

            return NextResponse.redirect(new URL(redirectPath, request.url));
        }

        if (error || !user) {
            // Si hay error o no hay usuario, eliminar la cookie y redirigir al login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('sb-access-token');
            return response;
        }

        // Token válido, permitir el acceso
        return NextResponse.next();
    } catch (error) {
        // En caso de error, eliminar la cookie y redirigir al login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('sb-access-token');
        return response;
    }
}

// Configurar las rutas que serán manejadas por el middleware
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};