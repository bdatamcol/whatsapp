import { NextRequest, NextResponse } from 'next/server';
import { CompanyMessengerTokenService } from '@/lib/messenger/services/company-token-service';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

// GET /api/messenger/company/verify-token?pageId=123456789
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get('pageId');

        if (!pageId) {
            return NextResponse.json({ 
                error: 'pageId es requerido' 
            }, { status: 400 });
        }

        // Obtener el perfil del usuario autenticado
        const profile = await getUserProfile();
        
        if (!profile?.company_id) {
            return NextResponse.json(
                { error: 'Usuario no tiene empresa asignada' },
                { status: 400 }
            );
        }

        // Verificar el token de la página usando la configuración de la empresa
        const verification = await CompanyMessengerTokenService.verifyPageToken(
            profile.company_id, 
            pageId
        );

        return NextResponse.json(verification);

    } catch (error: any) {
        console.error('Error en /api/messenger/company/verify-token:', error);
        return NextResponse.json(
            { 
                success: false,
                canSendMessages: false,
                missingPermissions: [],
                recommendations: [
                    'Error al verificar el token',
                    error.message || 'Error interno del servidor'
                ],
                error: error.message || 'Error interno del servidor'
            },
            { status: 500 }
        );
    }
}