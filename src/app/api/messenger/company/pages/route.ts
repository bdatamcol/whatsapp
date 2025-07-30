import { NextRequest, NextResponse } from 'next/server';
import { getCompanyMessengerPages } from '@/lib/messenger/services/company-messenger';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(request: NextRequest) {
    try {
        // Obtener el perfil del usuario autenticado
        const profile = await getUserProfile();
        
        if (!profile?.company_id) {
            return NextResponse.json(
                { error: 'Usuario no tiene empresa asignada' },
                { status: 400 }
            );
        }

        // Obtener las páginas de Facebook Messenger de la empresa
        const pages = await getCompanyMessengerPages(profile.company_id);

        return NextResponse.json({ 
            pages,
            total: pages.length,
            companyId: profile.company_id
        });

    } catch (error: any) {
        console.error('Error en /api/messenger/company/pages:', error);
        
        // Manejar errores específicos
        if (error.message?.includes('configuración de Facebook')) {
            return NextResponse.json(
                { error: error.message, type: 'CONFIG_MISSING' },
                { status: 400 }
            );
        }
        
        if (error.message?.includes('permisos de Messenger')) {
            return NextResponse.json(
                { error: 'Las páginas no tienen permisos de Messenger activados', type: 'PERMISSION_MISSING' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}