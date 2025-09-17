import { supabase } from '../supabase/server.supabase';

// Agregar tipo para incluir thread_id
interface ConversationData {
    messages: any[];
    thread_id?: string;
}

export async function getConversation(phone: string, companyId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from("conversations")
        .select("messages, thread_id")
        .eq("phone", phone)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) {
        console.error("Error getting conversation:", error);
    }

    return data?.messages || [];
}

export async function getThreadId(phone: string, companyId: string): Promise<string | null> {
    const { data } = await supabase
        .from("conversations")
        .select("thread_id")
        .eq("phone", phone)
        .eq("company_id", companyId)
        .maybeSingle();
    
    return data?.thread_id || null;
}

export async function updateConversation(
    phone: string,
    messages: any[],
    company: { id: string },
    threadId?: string
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
    const updateData: any = {
        phone,
        messages,
        company_id: company.id,
        updated_at: new Date().toISOString()
    };

    if (threadId) {
        updateData.thread_id = threadId;
    }

    const { error: upsertError } = await supabase
        .from("conversations")
        .upsert(updateData, {
            onConflict: "phone,company_id"
        });

    if (upsertError) {
        console.error("Error updating conversation:", upsertError);
    }
}
