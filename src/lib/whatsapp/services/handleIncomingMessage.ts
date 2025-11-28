import { supabase } from '@/lib/supabase/server.supabase';
import { getAllCitiesCached } from '@/lib/utils/cityCache';
import { findCityIdInText } from '@/lib/utils/cityMatcher';
import { getConversation, updateConversation } from '@/lib/ia/memory';
import IAService from '@/lib/ia/IAService';
import { CreditBotService } from '@/lib/ia/CreditBotService';
import { sendTemplateMessage } from './sendTemplateMessage';
import { needsHumanAgent } from '@/lib/utils/humanDetector';
import { upsertContact } from './contacts';
import { sendMessageToWhatsApp } from './send';
import { getCompanyByPhoneNumberId } from '../helpers/getCompanyByPhoneNumberId';

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
async function updateCityFromText(text: string, phone: string, companyId: string) {
    const cities = await getAllCitiesCached();
    const cityId = await findCityIdInText(text, cities);
    if (cityId) {
        await supabase.from('contacts').update({ city_id: cityId }).eq('phone', phone).eq('company_id', companyId);
    }
}

async function getContactStatus(phone: string, companyId: string): Promise<'new' | 'in_progress' | 'awaiting_response' | null> {
    const { data: contact } = await supabase
        .from('contacts')
        .select('status')
        .eq('phone', phone)
        .eq('company_id', companyId)
        .maybeSingle();

    return contact?.status ?? null;
}

// --- Función principal ---
export const handleIncomingMessage = async (message: any, metadata: IncomingMetadata) => {
    console.log('[HANDLE] Iniciando procesamiento de mensaje:', message.id);
    
    const type = message.type;
    const from = message.from;
    const text = message.text?.body || '';
    const phoneNumberId = metadata.metadata.phone_number_id;
    
    console.log(`[HANDLE] Datos recibidos: From=${from}, PhoneID=${phoneNumberId}, Type=${type}`);

    let company;
    try {
        company = await getCompanyByPhoneNumberId(phoneNumberId);
        if (!company) {
             console.error(`[HANDLE] ERROR: No se encontró empresa para PhoneID=${phoneNumberId}`);
             return;
        }
        console.log(`[HANDLE] Empresa encontrada: ID=${company.id}`);
    } catch (error) {
        console.error('[HANDLE] Error buscando empresa:', error);
        return;
    }

    const name = metadata.contacts?.[0]?.profile?.name || 'Desconocido';
    const timestamp = message.timestamp ? new Date(message.timestamp * 1000).toISOString() : new Date().toISOString();

    const userInput = type === 'button' ? message.button?.payload || '' : text;
    await updateCityFromText(text, from, company.id);

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
                    company_id: company.id,
                }),
            supabase
                .from('contacts')
                .update({ needs_human: true, status: 'waiting_human' })
                .eq('phone', from)
                .eq('company_id', company.id)
        ]);

        // Agregar el mensaje del usuario a la conversación
        const history = await getConversation(from, company.id);
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
        await updateConversation(from, updatedMessages, company);
        await sendMessageToWhatsApp({
            to: from,
            message: 'Gracias por tu mensaje. En breve un asesor humano se pondrá en contacto contigo.',
            company,
        });
        return;
    }

    const contactStatus = await getContactStatus(from, company.id);

    // Nuevo contacto
    if (!contactStatus || contactStatus === 'new') {
        await upsertContact({
            phone: from,
            name,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            status: 'in_progress',
            last_interaction_at: new Date().toISOString(),
            phone_number_id: phoneNumberId
        });

        // Guardar primer mensaje del usuario en la conversación
        const initialMessage = {
            id: message.id,
            role: 'user',
            content: userInput,
            timestamp,
        };
        await updateConversation(from, [initialMessage], company);
        await sendTemplateMessage({
            to: from,
            templateName: 'menu_inicial',
            company,
        });
        await updateConversation(from, [
            {
                id: `template-${Date.now()}`,
                role: 'system-template',
                type: 'template',
                content: '[Se envió la plantilla: menu_inicial]',
                timestamp: new Date().toISOString(),
                status: 'sent',
            }
        ], company);
        return;
    }

    // Verificamos si el contacto ya fue escalado a humano
    const { data: contact } = await supabase
        .from('contacts')
        .select('needs_human')
        .eq('phone', from)
        .eq('company_id', company.id)
        .maybeSingle();

    if (contact?.needs_human) {
        // IA bloqueada para contacto escalado a humano

        // Solo guardamos el nuevo mensaje del usuario
        const history = await getConversation(from, company.id);
        const updatedMessages = [
            ...history,
            {
                id: message.id,
                role: 'user',
                content: userInput,
                timestamp,
            },
        ];
        await updateConversation(from, updatedMessages, company);
        return;
    }

    const history = await getConversation(from, company.id);
    const enrichedPrompt = userInput;

    const updatedMessages = [
        ...history,
        { id: message.id, role: 'user', content: enrichedPrompt, timestamp },
    ];

    // Usar el bot de créditos con creación automática del Assistant
    let iaResponse: string;

    try {
        iaResponse = await CreditBotService.askCreditBot(from, enrichedPrompt, company);
    } catch (error: any) {
        console.error('Error en el servicio de IA:', error);
        // Fallback a un mensaje de error amigable
        iaResponse = 'Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en unos momentos.';
    }

    const messageId = await sendMessageToWhatsApp(
        {
            to: from,
            message: iaResponse,
            company
        }
    );

    updatedMessages.push({
        id: messageId,
        role: 'assistant',
        content: iaResponse,
        timestamp: new Date().toISOString(),
        status: 'sent',
    });

    await updateConversation(from, updatedMessages, company);
};
