import { supabase } from "@/lib/supabase/server.supabase";

export async function getCompanyByPhoneNumberId(phoneNumberId: string) {
    // console.log('[getCompanyByPhoneNumberId] Recibido:', phoneNumberId);

    const { data: company, error } = await supabase
        .from('companies')
        .select('id, whatsapp_access_token, whatsapp_number, phone_number_id, meta_app_id, waba_id')
        .eq('phone_number_id', phoneNumberId)
        .maybeSingle();

    if (error) console.error('[getCompanyByPhoneNumberId] Error:', error);
    if (!company) {
        console.warn('[getCompanyByPhoneNumberId] No se encontró la compañía con ese phone_number_id');
        throw new Error('Compañía no encontrada');
    }

    return company;
}
