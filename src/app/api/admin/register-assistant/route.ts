// src/app/api/register-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { registerAssistant } from '@/lib/admin/registerAssistant';

export async function POST(req: NextRequest) {

    try {
        const { email, password } = await req.json();

        // 1. Obtener perfil del admin (para extraer el company_id)
        const profile = await getUserProfile(req);
        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Solo un admin puede registrar asesores' }, { status: 403 });
        }

        const companyId = profile.company_id;

        // 2. Crear usuario en Supabase Auth
        const assistant = await registerAssistant(email, password, companyId);

        return NextResponse.json({ assistant });

    } catch (error) {
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 });
    }
}
