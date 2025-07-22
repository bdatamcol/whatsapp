// src/app/api/superadmin/delete-company/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { deleteCompany } from '@/lib/superadmin/services/delete-company';

export async function DELETE(req: NextRequest) {
    try {
        // Verificar que el usuario sea superadmin
        const profile = await getUserProfile(req);
        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Obtener el ID de la empresa a eliminar
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('id');

        if (!companyId) {
            return NextResponse.json({ error: 'ID de empresa requerido' }, { status: 400 });
        }

        // Eliminar la empresa
        await deleteCompany(companyId);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}