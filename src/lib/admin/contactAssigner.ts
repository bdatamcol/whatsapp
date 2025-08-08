// src/lib/whatsapp/services/assignments.ts
import { supabase } from '@/lib/supabase/server.supabase';

export async function assignContactToAssistant(
    contactPhone: string,
    assistantId: string,
    adminId: string
) {
    // 1. Obtener la empresa del admin que está asignando
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', adminId)
        .maybeSingle();

    if (!adminProfile?.company_id) {
        throw new Error('No se encontró la empresa del administrador');
    }

    const companyId = adminProfile.company_id;

    // 2. Verificar que el contacto y el asistente pertenezcan a la misma empresa
    // In assignContactToAssistant function, add validation for active assistants
    const [{ data: contact }, { data: assistant }] = await Promise.all([
        supabase.from('contacts').select('company_id').eq('phone', contactPhone).eq('company_id', companyId).maybeSingle(),
        supabase.from('profiles')
            .select('company_id, is_active')
            .eq('id', assistantId)
            .eq('company_id', companyId)
            .eq('is_active', true) // Only allow active assistants
            .maybeSingle()
    ]);

    if (!assistant || assistant.company_id !== companyId) {
        throw new Error('El asistente no pertenece a tu empresa');
    }

    if (!assistant.is_active) {
        throw new Error('El asistente está inactivo y no puede recibir asignaciones');
    }

    console.log('contact', contact);
    console.log('assistant', assistant);

    if (!contact || contact.company_id !== companyId) {
        throw new Error('El contacto no pertenece a tu empresa');
    }

    if (!assistant || assistant.company_id !== companyId) {
        throw new Error('El asistente no pertenece a tu empresa');
    }

    // 3. Cerrar cualquier asignación activa para ese contacto dentro de la misma empresa
    await supabase
        .from('assistants_assignments')
        .update({ active: false })
        .eq('contact_phone', contactPhone)
        .eq('company_id', companyId)
        .eq('active', true);

    // 4. Insertar nueva asignación
    const { error: assignmentError } = await supabase.from('assistants_assignments').insert({
        contact_phone: contactPhone,
        assigned_to: assistantId,
        assigned_by: adminId,
        company_id: companyId,
    });

    if (assignmentError) {
        throw new Error('No se pudo asignar el contacto');
    }

    // 5. Actualizar el contacto - PRESERVAR last_interaction_at original
    const { error: contactError } = await supabase
        .from('contacts')
        .update({
            needs_human: true,
            status: 'in_progress'
        })
        .eq('phone', contactPhone)
        .eq('company_id', companyId);

    if (contactError) {
        console.log('contactError', contactError);
        throw new Error('Error actualizando estado del contacto');
    }

    return { success: true };
}
