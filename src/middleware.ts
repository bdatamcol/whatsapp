import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const publicRoutes = [
        '/login',
        '/api/auth',
        '/api/public',
        '/api/health',
        '/api/whatsapp/webhook',
        '/_next',
        '/favicon.ico',
    ];

    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // SOLO verificar existencia de cookies
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    if (pathname === '/' && !accessToken && !refreshToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!accessToken && !refreshToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};