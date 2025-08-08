import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { supabase } from '@/lib/supabase/server.supabase';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ companyId: string }> }
) : Promise<NextResponse> {
    try {
        const profile = await getUserProfile(req);
        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { companyId } = await params;

        // Obtener todos los asistentes de la empresa, incluyendo eliminados
        const { data: assistants, error } = await supabase
            .from('profiles')
            .select('id, email, role, is_active, deleted_at, created_at')
            .eq('company_id', companyId)
            .eq('role', 'assistant')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ assistants });
    } catch (error) {
        console.error('Error al obtener asistentes:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}