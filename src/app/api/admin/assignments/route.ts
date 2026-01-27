import { NextRequest, NextResponse } from 'next/server';
import { assignContactToAssistant } from '@/lib/admin/contactAssigner';
import { supabase } from '@/lib/supabase/server.supabase';

export async function POST(req: NextRequest) {
    try {
        const { contactPhone, assistantId } = await req.json();

        // Obtener el usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await assignContactToAssistant(contactPhone, assistantId, user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error asignando contacto:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}