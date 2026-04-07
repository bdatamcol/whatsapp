import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { CompanyMessengerTokenService } from '@/lib/messenger/services/company-token-service';
import { MessengerAccountsService } from '@/lib/messenger/accounts';

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile();

    if (!profile?.id || !profile.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'No tienes permisos para enviar mensajes de Messenger' }, { status: 403 });
    }

    const body = await request.json();
    const pageId = String(body?.pageId || '').trim();
    const recipientId = String(body?.recipientId || '').trim();
    const text = String(body?.text || '').trim();

    if (!pageId || !recipientId || !text) {
      return NextResponse.json(
        { error: 'pageId, recipientId y text son obligatorios' },
        { status: 400 }
      );
    }

    const accessToken = await CompanyMessengerTokenService.getPageAccessToken(profile.company_id, pageId);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No se encontró token de página para enviar mensajes' },
        { status: 400 }
      );
    }

    const version = process.env.META_API_VERSION;
    const url = `https://graph.facebook.com/${version}/${pageId}/messages?access_token=${accessToken}`;

    const fbResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    const fbData = await fbResponse.json();

    if (!fbResponse.ok || fbData?.error) {
      const fbError = fbData?.error || {};
      const fbErrorMessage = String(fbError?.message || 'Facebook rechazó el envío del mensaje');
      const fbCode = fbError?.code;
      const fbSubcode = fbError?.error_subcode;

      if (fbCode === 10 && fbErrorMessage.toLowerCase().includes('another app is controlling this conversation')) {
        return NextResponse.json(
          {
            error: 'No se puede enviar desde este CRM porque otra app tiene el control de la conversación (Handover Protocol).',
            detail: fbErrorMessage,
            code: fbCode,
            subcode: fbSubcode,
            resolution: [
              'En Meta Developers > Messenger > Handover Protocol, configura esta app como Primary Receiver para la página.',
              'O desde la app que controla el hilo ejecuta pass_thread_control hacia esta app.',
              'Una vez transferido el control, el envío desde el CRM funcionará normalmente.'
            ]
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: fbErrorMessage,
          code: fbCode,
          subcode: fbSubcode,
        },
        { status: 400 }
      );
    }

    const message = {
      id: fbData?.message_id || `manual_${Date.now()}`,
      senderId: recipientId,
      pageId,
      text,
      timestamp: Date.now(),
      type: 'outgoing' as const,
      companyId: profile.company_id,
    };

    await MessengerAccountsService.saveMessage(message);

    return NextResponse.json({
      success: true,
      message,
      recipientId,
      facebook: {
        recipient_id: fbData?.recipient_id,
        message_id: fbData?.message_id,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/messenger/send:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
