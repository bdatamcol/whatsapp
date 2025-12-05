import { NextResponse } from 'next/server';

/**
 * API Pública para obtener las páginas de Facebook a las que tiene acceso un token
 * 
 * POST /api/public/pages
 * 
 * Body:
 * {
 *   "userAccessToken": "Token de acceso del usuario"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "page_id",
 *       "name": "Nombre de la página",
 *       "access_token": "Token de acceso de la página"
 *     }
 *   ]
 * }
 */

interface Page {
    id: string;
    name: string;
    access_token: string;
    category: string;
}

async function fetchFromMeta(url: string, accessToken: string) {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}access_token=${accessToken}`);
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message || 'Error de API de Meta');
    }
    return data;
}

export async function POST(request: Request) {
    try {
        const userAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;

        // Validación de parámetros requeridos
        if (!userAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requiere userAccessToken',
                    requiredParams: {
                        userAccessToken: 'Token de acceso del usuario (User Access Token)'
                    },
                    note: 'Este token es diferente al Page Access Token. Se obtiene al autenticarse con Facebook.'
                },
                { status: 400 }
            );
        }

        const version = process.env.META_API_VERSION;
        const baseUrl = 'https://graph.facebook.com';

        // Solo solicitar los campos de la interfaz Page
        const pagesUrl = `${baseUrl}/${version}/me/accounts?fields=id,name,access_token,category`;
        const pagesData = await fetchFromMeta(pagesUrl, userAccessToken);

        // Buscar solo la página de TownCenter
        const townCenterPage = (pagesData.data || []).find((page: any) =>
            page.name?.toLowerCase().includes('towncenter')
        );

        if (!townCenterPage) {
            return NextResponse.json({
                success: false,
                error: 'No se encontró la página de TownCenter'
            }, { status: 404 });
        }

        // Devolver solo la página de TownCenter
        const page: Page = {
            id: townCenterPage.id,
            name: townCenterPage.name,
            access_token: townCenterPage.access_token,
            category: townCenterPage.category
        };

        return NextResponse.json({
            success: true,
            data: page
        });

    } catch (error: any) {
        console.error('Error en /api/public/pages:', error);
        let errorMessage = error.message || 'Error al obtener páginas';
        let hint = '';

        if (error.message?.includes('Invalid OAuth access token')) {
            hint = 'El token proporcionado no es válido o ha expirado.';
        } else if (error.message?.includes('session has expired')) {
            hint = 'La sesión ha expirado. Necesitas generar un nuevo token.';
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                hint: hint || undefined
            },
            { status: 500 }
        );
    }
}