import { supabase } from '../supabase/server.supabase';
import { getCompanyByPhoneNumberId } from '../whatsapp/helpers/getCompanyByPhoneNumberId';

// Consulta una conversación específica por teléfono y empresa
export async function getConversation(phone: string, companyId: string) {
    const { data, error } = await supabase
        .from("conversations")
        .select("messages")
        .eq("phone", phone)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) {
        // Error handled silently
    }

    return data?.messages || [];
}

// Crea o actualiza una conversación asociada a un número y empresa
export async function updateConversation(
    phone: string,
    messages: any[],
    company: { id: string }
) {
    // Paso 1: asegurarse de que el contacto existe para esta empresa
    const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("phone")
        .eq("phone", phone)
        .eq("company_id", company.id)
        .maybeSingle();

    if (contactError) {
        return;
    }

    // Paso 2: si no existe, crearlo
    if (!contact) {
        const { error: insertError } = await supabase.from("contacts").insert({
            phone,
            company_id: company.id,
            created_at: new Date().toISOString(),
        });

        if (insertError) {
            return;
        }
    }

    // Paso 3: actualizar o insertar la conversación
    const { error: upsertError } = await supabase
        .from("conversations")
        .upsert(
            {
                phone,
                messages,
                company_id: company.id,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "phone,company_id", // clave compuesta
            }
        );

    if (upsertError) {
        // Error handled silently
    }
}
