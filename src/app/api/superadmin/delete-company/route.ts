// src/app/api/superadmin/delete-company/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { deactivateCompanyWithSessions, reactivateCompany } from '@/lib/superadmin/services/company-deactivation';

export async function DELETE(req: NextRequest) {
    try {
        // Verificar que el usuario sea superadmin
        const profile = await getUserProfile(req);
        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Obtener el ID de la empresa
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('id');

        if (!companyId) {
            return NextResponse.json({ error: 'ID de empresa requerido' }, { status: 400 });
        }

        // Desactivar empresa y cerrar sesiones
        const result = await deactivateCompanyWithSessions(companyId);
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error al desactivar empresa:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Verificar que el usuario sea superadmin
        const profile = await getUserProfile(req);
        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Obtener el ID de la empresa
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('id');

        if (!companyId) {
            return NextResponse.json({ error: 'ID de empresa requerido' }, { status: 400 });
        }

        // Reactivar la empresa
        const result = await reactivateCompany(companyId);
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error al reactivar empresa:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}