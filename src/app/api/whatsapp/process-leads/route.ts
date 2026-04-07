import { NextResponse } from 'next/server';
import { LeadsProcessor } from '@/lib/whatsapp/services/leadsProcessor';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function POST(request: Request) {
    try {
        const profile = await getUserProfile();

        if (!profile?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'assistant') {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }

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
