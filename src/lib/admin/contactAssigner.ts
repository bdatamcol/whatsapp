import { supabase } from '@/lib/supabase/server.supabase';

export async function assignContactToAssistant(contactPhone: string, assistantId: string, adminId: string) {
    // Cerrar asignaciones anteriores (por si las hay)
    await supabase
        .from('assistants_assignments')
        .update({ active: false })
        .eq('contact_phone', contactPhone)
        .eq('active', true);

    // Crear nueva asignación
    const { error } = await supabase.from('assistants_assignments').insert({
        contact_phone: contactPhone,
        assigned_to: assistantId,
        assigned_by: adminId,
    });

    return { error };
}
