import { NextResponse } from 'next/server';
import { LeadsProcessor } from '@/lib/whatsapp/services/leadsProcessor';

export async function POST(request: Request) {
    try {
        const { pageId, formId, pageAccessToken, cursor, companyId, templateName = 'menu_inicial', templateLanguage } = await request.json();

        if (!formId || !pageAccessToken || !companyId) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos: formId, pageAccessToken, companyId' },
                { status: 400 }
            );
        }

        const result = await LeadsProcessor.fetchAndProcessLeads(
            pageId,
            pageAccessToken,
            formId,
            cursor,
            companyId,
            templateName,
            templateLanguage
        );
        return NextResponse.json({
            success: result.success,
            data: {
                processed: result.processed,
                sent: result.sent,
                failed: result.failed,
                errors: result.errors
            }
        });

    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Error procesando leads' },
            { status: 500 }
        );
    }
}