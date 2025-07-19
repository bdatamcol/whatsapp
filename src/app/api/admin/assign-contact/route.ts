// src/app/api/admin/assign-contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { assignContactToAssistant } from '@/lib/admin/contactAssigner';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function POST(req: NextRequest) {
    try {
        const { phone, assistantId } = await req.json();

        // Validar parámetros básicos
        if (!phone || !assistantId) {
            return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 });
        }

        // Obtener perfil del usuario autenticado
        const admin = await getUserProfile();
        if (!admin?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Ejecutar asignación
        await assignContactToAssistant(phone, assistantId, admin.id);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error en asignación:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Error inesperado' },
            { status: 500 }
        );
    }
}

