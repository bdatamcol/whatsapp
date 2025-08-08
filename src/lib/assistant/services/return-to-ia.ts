// lib/assistant/services/return-to-ia.ts

import { supabase } from '@/lib/supabase/server.supabase';

export async function returnContactToIA(phone: string, companyId: string) {
    console.log('[return-to-ia] Iniciando proceso para devolver contacto a IA:', { phone, companyId });
    
    if (!phone || !companyId) {
        throw new Error('Falta número de teléfono o ID de empresa');
    }

    // 1. Actualizar contacto - NO actualizar last_interaction_at
    console.log('[return-to-ia] Actualizando contacto...');
    const { error: contactError } = await supabase
        .from('contacts')
        .update({
            needs_human: false,
            status: 'closed'
            // NOTA: last_interaction_at NO se actualiza para preservar la fecha real
        })
        .eq('phone', phone)
        .eq('company_id', companyId);

    if (contactError) {
        console.error('[return-to-ia] Error actualizando contacto:', contactError);
        throw new Error('Error actualizando contacto');
    }

    // 2. Desactivar asignación activa (sin updated_at)
    const { error: assignmentError } = await supabase
        .from('assistants_assignments')
        .update({ 
            active: false,
            updated_at: new Date().toISOString()
        })
        .eq('contact_phone', phone)
        .eq('company_id', companyId)
        .eq('active', true);

    if (assignmentError) {
        throw new Error('Error desasignando contacto');
    }
    return { success: true };
}
