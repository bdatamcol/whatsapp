import { supabase } from "@/lib/supabase/server.supabase";
import { getAllCitiesCached } from "@/lib/utils/cityCache";
import { findCityIdInText } from "@/lib/utils/cityMatcher";
import { upsertContact } from "../contacts";
import { getConversation, updateConversation } from "@/lib/ia/memory";
import IAService from "@/lib/ia/IAService";
import { sendTemplateMessage } from "./sendTemplateMessage";

const token_meta = process.env.WHATSAPP_API_TOKEN;
const version = process.env.META_API_VERSION;
const baseUrl = 'https://graph.facebook.com';

type IncomingMetadata = {
    messaging_product: 'whatsapp';
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts: {
        profile: Record<string, any>;
        wa_id: string;
    }[];
    messages: {
        from: string;
        id: string;
        timestamp: string;
        text: Record<string, any>;
        type: string;
    }[];
};

export const handleIncomingMessage = async (message: any, metadata: IncomingMetadata) => {
    const type = message.type;
    const from = message.from;
    const text = message.text?.body || '';
    const phoneNumberId = metadata.metadata.phone_number_id;
    const name = metadata.contacts?.[0]?.profile?.name || 'Desconocido';
    const timestamp = message.timestamp ? new Date(message.timestamp * 1000).toISOString() : new Date().toISOString();

    let userInput = '';

    // Si es un botón → tomamos el payload si no es texto
    if (type === 'button') {
        userInput = message.button?.payload || '';
    } else if (type === 'text') {
        userInput = text;
    }

    const cities = await getAllCitiesCached();
    const cityId = await findCityIdInText(text, cities);
    if (cityId) {
        await supabase
            .from('contacts')
            .update({ city_id: cityId })
            .eq('phone', from);
    }

    // obtener contacto actual
    const { data: contact } = await supabase
        .from('contacts')
        .select('status')
        .eq('phone', from)
        .maybeSingle();

    //Si es nuevo o sin estado conocido → enviar mensaje template
    if (!contact || contact.status === 'new') {
        await upsertContact({
            phone: from,
            name,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            status: 'in_progress',
            last_interaction_at: new Date().toISOString()
        });
        await sendTemplateMessage(from, phoneNumberId);
        return; // No seguimos con IA aún	
    }

    //Si estaba esperando respuesta → pasamos a IA (se asume que es respuesta válida)
    if (contact.status === 'awaiting_response') {
        await supabase
            .from('contacts')
            .update({ status: 'in_progress' })
            .eq('phone', from);
    }

    let enrichedPrompt = userInput;
    //Ahora sí, IA responde
    const history = await getConversation(from);
    const updatedMessages = [
        ...history,
        { id: message.id, role: 'user', content: enrichedPrompt, timestamp }
    ];

    const iaResponse = await IAService.askSmart(from, enrichedPrompt);

    //enviamos la respuesta por whatsapp
    const response = await fetch(`${baseUrl}/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token_meta}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: from,
            type: 'text',
            text: { body: iaResponse },
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    const messageId = data?.messages?.[0]?.id || crypto.randomUUID();
    updatedMessages.push({
        id: messageId,
        role: 'assistant',
        content: iaResponse,
        timestamp: new Date().toISOString(),
        status: 'sent'
    });
    await updateConversation(from, updatedMessages);

}
