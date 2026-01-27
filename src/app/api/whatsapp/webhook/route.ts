import { NextRequest, NextResponse } from 'next/server';
import { processWebhookRequest } from '@/lib/whatsapp/services/webhookDispatcher';


const mySecretToken = process.env.VERYFY_WEBHOOK_SECRET;

const processingMessageIds = new Set<string>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const challenge = searchParams.get('hub.challenge');
  const verify_token = searchParams.get('hub.verify_token');

  if (mode && verify_token) {
    if (mode === 'subscribe' && verify_token === mySecretToken) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json('Error de validacion', { status: 403 });
    }
  }
}

export async function POST(request: NextRequest) {
  const requestClone = request.clone();
  let body: any;

  try {
    body = await request.json();
  } catch (e) {
    console.error("Error parsing webhook body:", e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const messageId = change?.value?.messages?.[0]?.id;
  const isLeadGen = change?.field === 'leadgen';

  console.log('[Webhook] Received POST request');
  console.log('[Webhook] Received POST request');
  // Log completo del body para depuración profunda
  console.log('[Webhook] RAW BODY:', JSON.stringify(body, null, 2));

  console.log('[Webhook] Parsed Data:', {
    object: body.object,
    entryId: entry?.id,
    field: change?.field,
    pageId: change?.value?.page_id,
    leadgenId: change?.value?.leadgen_id,
    messageId,
  });
  console.log('[isLeadGen]', isLeadGen);

  if (!messageId && !isLeadGen) {
    return NextResponse.json('OK (Not a message or lead event)', { status: 200 });
  }

  // Si es leadgen, procesamos en segundo plano (fire-and-forget) para evitar timeouts de Meta
  if (isLeadGen) {
    processWebhookRequest(requestClone as NextRequest)
        .catch(error => console.error('[WEBHOOK-ERROR] Error processing leadgen webhook:', error));
    
    return NextResponse.json('OK (Lead Processing Started)', { status: 200 });
  }

  if (messageId && processingMessageIds.has(messageId)) {
    console.log(`Webhook duplicado ignorado: ${messageId}`);
    return NextResponse.json('OK (Duplicate)', { status: 200 });
  }

  if (messageId) {
    processingMessageIds.add(messageId);

    setTimeout(() => {
        processingMessageIds.delete(messageId);
    }, 120 * 1000);
  }


  try {
    await processWebhookRequest(requestClone as NextRequest);
  } catch (error) {
    console.error('[WEBHOOK-ERROR] Error processing webhook:', error);
  } finally {
    if (messageId) {
        processingMessageIds.delete(messageId);
    }
  }

  return NextResponse.json('OK (Processed)', { status: 200 });
}