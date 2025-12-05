import { NextResponse } from 'next/server';

/**
 * API Pública para obtener formularios de Lead Gen de una página de Facebook
 * 
 * POST /api/public/forms
 * 
 * Body:
 * {
 *   "pageId": "ID de la página de Facebook",
 *   "pageAccessToken": "Token de acceso de la página"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "form_id",
 *       "name": "Nombre del formulario",
 *       "status": "ACTIVE",
 *       "created_time": "2024-01-01T00:00:00+0000"
 *     }
 *   ]
 * }
 */

async function fetchFromMeta(url: string, accessToken: string) {
    const response = await fetch(`${url}&access_token=${accessToken}`);
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message || 'Error de API de Meta');
    }
    return data;
}

export async function POST(request: Request) {
    try {
        const { pageId, pageAccessToken } = await request.json();

        // Validación de parámetros requeridos
        if (!pageId || !pageAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requieren pageId y pageAccessToken',
                    requiredParams: {
                        pageId: 'ID de la página de Facebook',
                        pageAccessToken: 'Token de acceso de la página'
                    }
                },
                { status: 400 }
            );
        }

        const version = process.env.META_API_VERSION;
        const baseUrl = 'https://graph.facebook.com';

        // Obtener formularios de la página
        const formsUrl = `${baseUrl}/${version}/${pageId}/leadgen_forms?fields=name,id,status,created_time,leads_count`;
        const formsData = await fetchFromMeta(formsUrl, pageAccessToken);

        return NextResponse.json({
            success: true,
            pageId,
            totalForms: formsData.data?.length || 0,
            data: formsData.data || []
        });

    } catch (error: any) {
        console.error('Error en /api/public/forms:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al obtener formularios'
            },
            { status: 500 }
        );
    }
}

// También soportar GET con query params para mayor flexibilidad
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get('pageId');
        const pageAccessToken = searchParams.get('pageAccessToken');

        if (!pageId || !pageAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requieren pageId y pageAccessToken como query params',
                    example: '/api/public/forms?pageId=YOUR_PAGE_ID&pageAccessToken=YOUR_TOKEN'
                },
                { status: 400 }
            );
        }

        const version = process.env.META_API_VERSION;
        const baseUrl = 'https://graph.facebook.com';

        const formsUrl = `${baseUrl}/${version}/${pageId}/leadgen_forms?fields=name,id,status,created_time,leads_count`;
        const formsData = await fetchFromMeta(formsUrl, pageAccessToken);

        return NextResponse.json({
            success: true,
            pageId,
            totalForms: formsData.data?.length || 0,
            data: formsData.data || []
        });

    } catch (error: any) {
        console.error('Error en GET /api/public/forms:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al obtener formularios'
            },
            { status: 500 }
        );
    }
}
