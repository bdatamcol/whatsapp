import { NextRequest, NextResponse } from 'next/server';
import { handleStatusEvent } from './handleStatusEvent';
import { handleIncomingMessage } from './handleIncomingMessage';
import { handleLeadGenEvent } from './handleLeadGenEvent';

function isStaleIncomingMessage(timestampSeconds?: string): boolean {
    if (!timestampSeconds) return false;

    const eventTimestampMs = Number(timestampSeconds) * 1000;
    if (!Number.isFinite(eventTimestampMs)) return false;

    const maxAgeMinutes = Number(process.env.WHATSAPP_MAX_EVENT_AGE_MINUTES || 720);
    const maxAgeMs = Math.max(1, maxAgeMinutes) * 60 * 1000;

    return Date.now() - eventTimestampMs > maxAgeMs;
}

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

    if (isStaleIncomingMessage(message.timestamp)) {
        console.warn('[Webhook] Mensaje ignorado por antigüedad:', {
            id: message.id,
            timestamp: message.timestamp,
            from: message.from,
        });
        return NextResponse.json({ success: true, ignored: 'stale_message' }, { status: 200 });
    }

    await handleIncomingMessage(message, value);
    return NextResponse.json({ success: true });
}
