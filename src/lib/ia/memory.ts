import { supabase } from "../supabase/server.supabase";
import { getCompanyByPhoneNumberId } from "../whatsapp/helpers/getCompanyByPhoneNumberId";


/* 
s*
@param {string} phone - The phone number of the user.
 */

export async function getConversation(phone: string) {
    const { data, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('phone', phone)
        .maybeSingle();

    if (error) {
        console.error(`Error consultando historial para ${phone}:`, error.message);
    }

    if (!data) {
        // console.log(`📭 No hay historial para ${phone}`);
        return [];
    }

    return data.messages || [];
}

export async function updateConversation(
    phone: string,
    messages: any[],
    company: { id: string }
) {
    // console.log(`📭 Actualizando historial para ${phone}`);

    const { error } = await supabase
        .from('conversations')
        .upsert(
            {
                phone,
                messages,
                company_id: company.id,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'phone' }
        );

    if (error) {
        console.error('Error al guardar conversación:', error);
    }
}
