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
    const [{ data: contact }, { data: assistant }] = await Promise.all([
        supabase.from('contacts').select('company_id').eq('phone', contactPhone).maybeSingle(),
        supabase.from('profiles').select('company_id').eq('id', assistantId).maybeSingle()
    ]);

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
    const { error } = await supabase.from('assistants_assignments').insert({
        contact_phone: contactPhone,
        assigned_to: assistantId,
        assigned_by: adminId,
        company_id: companyId,
    });

    if (error) {
        console.error('Error al asignar contacto:', error.message);
        throw new Error('No se pudo asignar el contacto');
    }

    return { success: true };
}
