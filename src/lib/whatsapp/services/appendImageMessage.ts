import { supabase } from '@/lib/supabase/server.supabase';

export async function appendImageMessageToConversation(
    phone: string, 
    message: string, 
    imageUrl: string,
    messageId: string, 
    companyId: string, 
    role: string = 'assistant'
) {
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
        type: 'image',
        imageUrl: imageUrl,
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

    if (upsertError) throw new Error('Error guardando mensaje de imagen');
}