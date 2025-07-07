import { NextRequest, NextResponse } from 'next/server';
import { handleStatusEvent } from './handleStatusEvent';
import { handleIncomingMessage } from './handleIncomingMessage';

export async function processWebhookRequest(request: NextRequest): Promise<NextResponse> {
    const data = await request.json();

    const entry = data.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

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
