import { NextResponse } from 'next/server';

/**
 * API Pública para obtener leads de un formulario de Facebook
 * 
 * POST /api/public/leads
 * 
 * Body:
 * {
 *   "formId": "ID del formulario",
 *   "pageAccessToken": "Token de acceso de la página",
 *   "cursor": "Cursor para paginación (opcional)",
 *   "limit": 50 (opcional, máx 100)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "formId": "form_id",
 *   "totalLeads": 100,
 *   "data": [...leads],
 *   "paging": {
 *     "cursors": { "before": "...", "after": "..." },
 *     "next": "..."
 *   }
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
        const { formId, pageAccessToken, cursor, limit = 50 } = await request.json();

        // Validación de parámetros requeridos
        if (!formId || !pageAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requieren formId y pageAccessToken',
                    requiredParams: {
                        formId: 'ID del formulario de Lead Gen',
                        pageAccessToken: 'Token de acceso de la página'
                    },
                    optionalParams: {
                        cursor: 'Cursor para paginación (usar paging.cursors.after del response anterior)',
                        limit: 'Cantidad de leads por página (default: 50, máx: 100)'
                    }
                },
                { status: 400 }
            );
        }

        const version = process.env.META_API_VERSION;
        const baseUrl = 'https://graph.facebook.com';
        const actualLimit = Math.min(Math.max(1, limit), 100); // Entre 1 y 100

        // Primero obtener el total de leads
        const summaryUrl = `${baseUrl}/${version}/${formId}/leads?summary=true`;
        const summaryData = await fetchFromMeta(summaryUrl, pageAccessToken);
        const totalLeads = summaryData.summary?.total_count || 0;

        // Obtener leads con paginación
        const leadsUrl = `${baseUrl}/${version}/${formId}/leads?fields=created_time,field_data&limit=${actualLimit}${cursor ? `&after=${cursor}` : ''}`;
        const leadsData = await fetchFromMeta(leadsUrl, pageAccessToken);

        // Formatear los leads para que sean más fáciles de usar
        const formattedLeads = (leadsData.data || []).map((lead: any) => {
            const fields: Record<string, string> = {};
            (lead.field_data || []).forEach((field: any) => {
                fields[field.name] = field.values?.[0] || '';
            });
            return {
                id: lead.id,
                created_time: lead.created_time,
                fields
            };
        });

        return NextResponse.json({
            success: true,
            formId,
            totalLeads,
            returnedLeads: formattedLeads.length,
            data: formattedLeads,
            paging: leadsData.paging || null,
            hasMore: !!leadsData.paging?.next
        });

    } catch (error: any) {
        console.error('Error en /api/public/leads:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al obtener leads'
            },
            { status: 500 }
        );
    }
}

// También soportar GET con query params
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const formId = searchParams.get('formId');
        const pageAccessToken = searchParams.get('pageAccessToken');
        const cursor = searchParams.get('cursor');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!formId || !pageAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Se requieren formId y pageAccessToken como query params',
                    example: '/api/public/leads?formId=YOUR_FORM_ID&pageAccessToken=YOUR_TOKEN&limit=50'
                },
                { status: 400 }
            );
        }

        const version = process.env.META_API_VERSION;
        const baseUrl = 'https://graph.facebook.com';
        const actualLimit = Math.min(Math.max(1, limit), 100);

        // Obtener total
        const summaryUrl = `${baseUrl}/${version}/${formId}/leads?summary=true`;
        const summaryData = await fetchFromMeta(summaryUrl, pageAccessToken);
        const totalLeads = summaryData.summary?.total_count || 0;

        // Obtener leads
        const leadsUrl = `${baseUrl}/${version}/${formId}/leads?fields=created_time,field_data&limit=${actualLimit}${cursor ? `&after=${cursor}` : ''}`;
        const leadsData = await fetchFromMeta(leadsUrl, pageAccessToken);

        const formattedLeads = (leadsData.data || []).map((lead: any) => {
            const fields: Record<string, string> = {};
            (lead.field_data || []).forEach((field: any) => {
                fields[field.name] = field.values?.[0] || '';
            });
            return {
                id: lead.id,
                created_time: lead.created_time,
                fields
            };
        });

        return NextResponse.json({
            success: true,
            formId,
            totalLeads,
            returnedLeads: formattedLeads.length,
            data: formattedLeads,
            paging: leadsData.paging || null,
            hasMore: !!leadsData.paging?.next
        });

    } catch (error: any) {
        console.error('Error en GET /api/public/leads:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al obtener leads'
            },
            { status: 500 }
        );
    }
}
