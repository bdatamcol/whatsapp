import { supabase } from '@/lib/supabase/server.supabase';
import { getAllCitiesCached } from '@/lib/utils/cityCache';
import { findCityIdInText } from '@/lib/utils/cityMatcher';
import { upsertContact } from '../contacts';
import { getConversation, updateConversation } from '@/lib/ia/memory';
import IAService from '@/lib/ia/IAService';
import { sendTemplateMessage } from './sendTemplateMessage';
import { needsHumanAgent } from '@/lib/utils/humanDetector';

const token_meta = process.env.WHATSAPP_API_TOKEN!;
const version = process.env.META_API_VERSION!;
const baseUrl = 'https://graph.facebook.com';

// --- Tipos ---
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
        button?: { payload?: string };
    }[];
};

// --- Funciones privadas ---
async function updateCityFromText(text: string, phone: string) {
    const cities = await getAllCitiesCached();
    const cityId = await findCityIdInText(text, cities);
    if (cityId) {
        await supabase.from('contacts').update({ city_id: cityId }).eq('phone', phone);
    }
}

async function getContactStatus(phone: string): Promise<'new' | 'in_progress' | 'awaiting_response' | null> {
    const { data: contact } = await supabase
        .from('contacts')
        .select('status')
        .eq('phone', phone)
        .maybeSingle();

    return contact?.status ?? null;
}

async function sendMessageToWhatsApp(phone: string, phoneNumberId: string, message: string) {
    const response = await fetch(`${baseUrl}/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token_meta}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    return data?.messages?.[0]?.id || crypto.randomUUID();
}

// --- Función principal ---
export const handleIncomingMessage = async (message: any, metadata: IncomingMetadata) => {
    const type = message.type;
    const from = message.from;
    const text = message.text?.body || '';
    const phoneNumberId = metadata.metadata.phone_number_id;
    const name = metadata.contacts?.[0]?.profile?.name || 'Desconocido';
    const timestamp = message.timestamp ? new Date(message.timestamp * 1000).toISOString() : new Date().toISOString();

    const userInput = type === 'button' ? message.button?.payload || '' : text;

    await updateCityFromText(text, from);

    //detectar si necesita humano
    const detection = needsHumanAgent(userInput);
    if (detection.match) {
        //inser audutoria
        await Promise.all([
            supabase.from('human_requests_audit')
                .insert({
                    phone: from,
                    message: userInput,
                    matched_keyword: detection.keyword,
                }),
            supabase
                .from('contacts')
                .update({ needs_human: true, status: 'waiting_human' })
                .eq('phone', from)
        ]);

        // Agregar el mensaje del usuario a la conversación
        const history = await getConversation(from);
        const timestamp = new Date().toISOString();
        const updatedMessages = [
            ...history,
            {
                id: message.id,
                role: 'user',
                content: userInput,
                timestamp,
            },
            {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Gracias por tu mensaje. En breve un asesor humano se pondrá en contacto contigo.',
                timestamp,
                status: 'read',
            }
        ];

        // Actualizar conversación y responder al cliente
        await updateConversation(from, updatedMessages);
        await sendMessageToWhatsApp(from, phoneNumberId, 'Gracias por tu mensaje. En breve un asesor humano se pondrá en contacto contigo.');
        return;
    }

    const contactStatus = await getContactStatus(from);

    // Nuevo contacto
    if (!contactStatus || contactStatus === 'new') {
        await upsertContact({
            phone: from,
            name,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            status: 'in_progress',
            last_interaction_at: new Date().toISOString(),
        });

        // Guardar primer mensaje del usuario en la conversación
        const initialMessage = {
            id: message.id,
            role: 'user',
            content: userInput,
            timestamp,
        };
        await updateConversation(from, [initialMessage]);
        await sendTemplateMessage(from, phoneNumberId);
        await updateConversation(from, [
            {
                id: `template-${Date.now()}`,
                role: 'system',
                type: 'template',
                content: '[Se envió la plantilla: menu_inicial]',
                timestamp: new Date().toISOString(),
                status: 'sent',
            }
        ]);
        return;
    }

    // Estaba esperando respuesta → lo marcamos en progreso
    // if (contactStatus === 'awaiting_response') {
    //     await supabase.from('contacts').update({ status: 'in_progress' }).eq('phone', from);
    // }
    // Verificamos si el contacto ya fue escalado a humano
    const { data: contact } = await supabase
        .from('contacts')
        .select('needs_human')
        .eq('phone', from)
        .maybeSingle();

    if (contact?.needs_human) {
        console.log(`[IA BLOQUEADA] Contacto ${from} fue escalado a humano. La IA no responderá.`);

        // Solo guardamos el nuevo mensaje del usuario
        const history = await getConversation(from);
        const updatedMessages = [
            ...history,
            {
                id: message.id,
                role: 'user',
                content: userInput,
                timestamp,
            },
        ];
        await updateConversation(from, updatedMessages);
        return;
    }

    const history = await getConversation(from);
    const enrichedPrompt = userInput;

    const updatedMessages = [
        ...history,
        { id: message.id, role: 'user', content: enrichedPrompt, timestamp },
    ];

    const iaResponse = await IAService.askSmart(from, enrichedPrompt);
    const messageId = await sendMessageToWhatsApp(from, phoneNumberId, iaResponse);

    updatedMessages.push({
        id: messageId,
        role: 'assistant',
        content: iaResponse,
        timestamp: new Date().toISOString(),
        status: 'sent',
    });

    await updateConversation(from, updatedMessages);
};
