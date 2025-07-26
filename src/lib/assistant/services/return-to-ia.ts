// lib/assistant/services/return-to-ia.ts

import { supabase } from '@/lib/supabase/server.supabase';

export async function returnContactToIA(phone: string, companyId: string) {
    if (!phone || !companyId) {
        throw new Error('Falta número de teléfono o ID de empresa');
    }

    // 1. Actualizar contacto
    const { error: contactError } = await supabase
        .from('contacts')
        .update({
            needs_human: false,
            status: 'closed',
            last_interaction_at: new Date().toISOString()
        })
        .eq('phone', phone)
        .eq('company_id', companyId);

    if (contactError) {
        throw new Error('Error actualizando contacto');
    }

    // 2. Desactivar asignación activa
    const { error: assignmentError } = await supabase
        .from('assistants_assignments')
        .update({ active: false })
        .eq('contact_phone', phone)
        .eq('company_id', companyId)
        .eq('active', true);

    if (assignmentError) {
        throw new Error('Error desasignando contacto');
    }

    return { success: true };
}
