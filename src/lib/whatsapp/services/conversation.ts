import { supabase } from '@/lib/supabase/server.supabase';

export async function appendMessageToConversation(phone: string, message: string, messageId: string, companyId: string, role: string = 'assistant') {
    const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('messages')
        .eq('phone', phone)
        .eq('company_id', companyId)
        .maybeSingle();

    if (fetchError) throw new Error('Error consultando historial');

    const newMessage = {
        id: messageId,
        role,
        content: message,
        timestamp: new Date().toISOString(),
        status: 'sent',
    };

    const updatedMessages = [...(existing?.messages || []), newMessage];

    const { error: upsertError } = await supabase
        .from('conversations')
        .upsert({
            phone,
            messages: updatedMessages,
            company_id: companyId,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'phone,company_id' });

    if (upsertError) throw new Error('Error guardando mensaje');
}

export type Role = 'user' | 'assistant' | 'assistant_humano';
export async function getMessagesForContact(phone: string, companyId: string): Promise<
    { id: string; role: Role; content: string; status: string; timestamp: string }[]
> {

    const { data, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('phone', phone)
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) {
        throw new Error('No se pudieron obtener los mensajes', error);
    }

    return (
        data?.messages?.map((msg: any, i: number) => ({
            id: `${phone}-${i}`,
            role: msg.role,
            content: msg.content,
            status: msg.status,
            timestamp: msg.timestamp || new Date().toISOString(),
        })) || []
    );

}



type ConversationSummary = {
    phone: string;
    name: string;
    avatar_url: string | null;
    updated_at: string;
    lastMessage: {
        id?: string;
        role?: string;
        content?: string;
        status?: string;
        timestamp?: string;
    } | null;
};

export async function getAllConversationsSummary(companyId: string): Promise<ConversationSummary[]> {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
      phone,
      messages,
      updated_at,
      company_id,
      contacts (
        name,
        avatar_url
      )
    `)
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

    if (error || !data) {
        console.error('Error al obtener conversaciones:', error);
        throw new Error(error?.message || 'Sin datos');
    }

    return data.map((conv: any) => {
        const lastMessage = conv.messages?.slice(-1)[0] || null;
        const contact = conv.contacts;

        return {
            phone: conv.phone,
            lastMessage,
            updated_at: conv.updated_at,
            name: contact?.name || conv.phone,
            avatar_url: contact?.avatar_url || null,
            company_id: conv.company_id, // 👈 asegúrate de devolverlo
        };
    });
}