// src/app/api/superadmin/list-companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { listCompanies } from '@/lib/superadmin/services/list-companies';

export async function GET(req: NextRequest) {
    try {
        // Verificar que el usuario sea superadmin
        const profile = await getUserProfile(req);
        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Obtener la lista de empresas
        const { companies } = await listCompanies();
        
        return NextResponse.json({ companies });
    } catch (error) {
        console.error('Error al listar empresas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}