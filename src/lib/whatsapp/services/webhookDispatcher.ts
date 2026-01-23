import { NextRequest, NextResponse } from 'next/server';
import { handleStatusEvent } from './handleStatusEvent';
import { handleIncomingMessage } from './handleIncomingMessage';
import { handleLeadGenEvent } from './handleLeadGenEvent';

export async function processWebhookRequest(request: NextRequest): Promise<NextResponse> {
    const data = await request.json();

    const entry = data.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Evento de Leadgen (Formularios de Meta Ads)
    if (change?.field === 'leadgen') {
        const leadgenId = value?.leadgen_id;
        const pageId = value?.page_id || entry.id; // entry.id suele ser el Page ID en webhooks de Page

        if (leadgenId) {
            await handleLeadGenEvent(leadgenId, pageId);
            return NextResponse.json({ success: true });
        }
    }

    // Evento de estado (enviado, entregado, leído)
    const statusEvent = value?.statuses?.[0];
    if (statusEvent) {
        const result = await handleStatusEvent(statusEvent);
        if (result) return result;
    }

    // Evento de mensaje
    const message = value?.messages?.[0];
    const allowedTypes = ['text', 'button'];

    if (!message || !allowedTypes.includes(message.type)) {
        return NextResponse.json({ error: `Unsupported message type: ${message?.type}` }, { status: 200 });
    }

    await handleIncomingMessage(message, value);
    return NextResponse.json({ success: true });
}
