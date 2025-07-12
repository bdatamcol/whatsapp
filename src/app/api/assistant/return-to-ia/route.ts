// src/app/api/assistant/return-to-ia/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';

export async function POST(req: Request) {
    const { phone } = await req.json();

    if (!phone) {
        return NextResponse.json({ error: 'Falta número de teléfono' }, { status: 400 });
    }

    // 1. Marcar contacto como sin necesidad de humano
    const { error: contactError } = await supabase
        .from('contacts')
        .update({ needs_human: false, status: 'in_progress' })
        .eq('phone', phone);

    if (contactError) {
        return NextResponse.json({ error: 'Error actualizando contacto' }, { status: 500 });
    }

    // 2. Desactivar asignación activa
    const { error: assignmentError } = await supabase
        .from('assistants_assignments')
        .update({ active: false })
        .eq('contact_phone', phone)
        .eq('active', true); // opcional, por seguridad

    if (assignmentError) {
        return NextResponse.json({ error: 'Error desasignando contacto' }, { status: 500 });
    }

    // 3. Mensaje opcional al cliente
    // (opcional) puedes enviar uno automático aquí si lo deseas

    return NextResponse.json({ success: true });
}
