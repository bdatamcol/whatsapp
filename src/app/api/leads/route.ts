import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const version = process.env.META_API_VERSION || 'v17.0';
    const { pageId, pageAccessToken, formId } = await request.json();
    const baseUrl = 'https://graph.facebook.com';

    if (!formId && (!pageId || !pageAccessToken)) {
        return NextResponse.json({ error: 'Se requieren pageId y pageAccessToken para listar formularios' }, { status: 400 });
    }

    try {
        // Si se proporciona formId, obtener leads específicos de ese formulario
        if (formId) {
            const leadsResponse = await fetch(
                `${baseUrl}/${version}/${formId}/leads?access_token=${pageAccessToken}&fields=created_time,field_data`
            );
            const leadsData = await leadsResponse.json();

            if (leadsData.error) {
                throw new Error(leadsData.error.message);
            }

            return NextResponse.json({
                success: true,
                data: leadsData.data
            });
        }

        // Si no hay formId, obtener lista de formularios
        const formsResponse = await fetch(
            `${baseUrl}/${version}/${pageId}/leadgen_forms?fields=name,id,status,created_time&access_token=${pageAccessToken}`
        );
        const formsData = await formsResponse.json();

        if (formsData.error) {
            throw new Error(formsData.error.message);
        }

        return NextResponse.json({
            success: true,
            data: formsData.data
        });

    } catch (error: any) {
        console.error('Error en la API de leads:', error);
        return NextResponse.json(
            { error: error.message || 'Error al procesar la solicitud de leads' },
            { status: 500 }
        );
    }
}