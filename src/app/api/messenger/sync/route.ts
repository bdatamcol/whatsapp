import { NextRequest, NextResponse } from 'next/server';
import { MessengerAccountsService } from '@/lib/messenger/accounts';

async function fetchJsonWithTimeout(url: string, timeoutMs = 30000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.error?.message || `Facebook API error ${response.status}`);
    }

    return json;
  } finally {
    clearTimeout(timeoutId);
  }
}

function toGraphUrl(path: string, params: Record<string, string | number | undefined>) {
  const base = `https://graph.facebook.com/${process.env.META_API_VERSION}/${path}`;
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      qs.append(k, String(v));
    }
  });

  return `${base}?${qs.toString()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'pageId es requerido' }, { status: 400 });
    }

    const deepSync = searchParams.get('full') === 'true';
    const maxConversationPages = Number(searchParams.get('maxConversationPages') || (deepSync ? '20' : '8'));
    const maxMessagesPerConversationPages = Number(searchParams.get('maxMessagesPages') || (deepSync ? '20' : '6'));
    const maxSentPages = Number(searchParams.get('maxSentPages') || (deepSync ? '10' : '4'));
    const conversationPageLimit = Number(searchParams.get('conversationLimit') || '50');
    const messagesPageLimit = Number(searchParams.get('messagesLimit') || '100');

    const accessToken = MessengerAccountsService.getPageAccessToken(pageId);
    if (!accessToken) {
      return NextResponse.json({ error: 'No se encontró token de acceso para esta página' }, { status: 404 });
    }

    const conversations: any[] = [];
    let conversationAfter: string | undefined;

    for (let page = 0; page < maxConversationPages; page++) {
      const conversationsUrl = toGraphUrl(`${pageId}/conversations`, {
        fields: 'id,participants,updated_time',
        limit: conversationPageLimit,
        after: conversationAfter,
        access_token: accessToken,
      });

      const conversationsData = await fetchJsonWithTimeout(conversationsUrl, 35000);
      const pageItems = conversationsData.data || [];
      conversations.push(...pageItems);

      conversationAfter = conversationsData?.paging?.cursors?.after;
      if (!conversationAfter || pageItems.length === 0) {
        break;
      }
    }

    let totalMessagesSynced = 0;

    const sentMessages: any[] = [];
    try {
      let sentAfter: string | undefined;

      for (let i = 0; i < maxSentPages; i++) {
        const sentUrl = toGraphUrl(`${pageId}/messages`, {
          fields: 'message,from,to,created_time,id,sticker,attachments',
          limit: messagesPageLimit,
          after: sentAfter,
          access_token: accessToken,
        });

        const sentMessagesData = await fetchJsonWithTimeout(sentUrl, 30000);
        const chunk = sentMessagesData.data || [];
        sentMessages.push(...chunk);

        sentAfter = sentMessagesData?.paging?.cursors?.after;
        if (!sentAfter || chunk.length === 0) {
          break;
        }
      }
    } catch {
      // No bloquear sync por este endpoint opcional
    }

    const conversationsFound = conversations.length;
    let processedConversations = 0;

    const existingMessageIds = new Set<string>();
    try {
      const allExistingMessages = await MessengerAccountsService.getAllMessages(pageId);
      allExistingMessages.forEach((msg) => existingMessageIds.add(msg.id));
    } catch {
      // noop
    }

    for (const conversation of conversations) {
      try {
        const participants = conversation.participants?.data || [];
        const participantNames = new Map<string, string>();

        for (const p of participants) {
          if (p?.id && p?.name) {
            participantNames.set(String(p.id), String(p.name));
          }
        }

        const messages: any[] = [];
        let messagesAfter: string | undefined;

        for (let p = 0; p < maxMessagesPerConversationPages; p++) {
          const convMessagesUrl = toGraphUrl(`${conversation.id}/messages`, {
            fields: 'message,from,to,created_time,id,sticker,attachments',
            limit: messagesPageLimit,
            after: messagesAfter,
            access_token: accessToken,
          });

          const messagesData = await fetchJsonWithTimeout(convMessagesUrl, 30000);
          const chunk = messagesData.data || [];
          messages.push(...chunk);

          messagesAfter = messagesData?.paging?.cursors?.after;
          if (!messagesAfter || chunk.length === 0) {
            break;
          }
        }

        if (!messages.length) {
          continue;
        }

        for (const message of messages) {
          try {
            if (!message.id || !message.from?.id) {
              continue;
            }

            const isFromPage = String(message.from?.id) === String(pageId);
            const type = isFromPage ? 'outgoing' : 'incoming';

            let userId: string | undefined;
            if (isFromPage) {
              userId = message.to?.data?.[0]?.id || participants.find((part: any) => part.id !== pageId)?.id;
            } else {
              userId = message.from?.id;
            }

            if (!userId) continue;

            const senderName =
              participantNames.get(String(userId)) ||
              message.from?.name ||
              `Usuario ${String(userId).slice(-4)}`;

            if (existingMessageIds.has(message.id)) {
              continue;
            }

            existingMessageIds.add(message.id);
            await MessengerAccountsService.saveMessage({
              id: message.id,
              senderId: String(userId),
              pageId,
              text: message.message || '',
              timestamp: new Date(message.created_time).getTime(),
              type,
              senderName,
            });

            totalMessagesSynced++;
          } catch {
            continue;
          }
        }

        processedConversations++;
        await new Promise((resolve) => setTimeout(resolve, 30));
      } catch {
        continue;
      }
    }

    for (const message of sentMessages) {
      try {
        if (!message.id || !message.to?.data?.[0]?.id) {
          continue;
        }

        const userId = String(message.to.data[0].id);
        const senderName = message.to.data[0]?.name || `Usuario ${userId.slice(-4)}`;

        if (existingMessageIds.has(message.id)) {
          continue;
        }

        existingMessageIds.add(message.id);
        await MessengerAccountsService.saveMessage({
          id: message.id,
          senderId: userId,
          pageId,
          text: message.message || '',
          timestamp: new Date(message.created_time).getTime(),
          type: 'outgoing',
          senderName,
        });

        totalMessagesSynced++;
      } catch {
        continue;
      }
    }

    const stats = await MessengerAccountsService.getPageStats(pageId);
    const warnings: string[] = [];

    if (MessengerAccountsService.getStorageMode() === 'local') {
      const dbError = MessengerAccountsService.getLastDbError();
      warnings.push(
        `Se está usando almacenamiento local del servidor (sin Supabase) para Messenger.${dbError ? ` Error DB: ${dbError}` : ''}`
      );
    }

    if (conversationsFound === 0) {
      warnings.push('Facebook devolvió 0 conversaciones para esta página/token. Revisa permisos pages_messaging/pages_read_engagement y que el token sea de página.');
    }

    return NextResponse.json({
      success: true,
      conversationsFound,
      conversationsProcessed: processedConversations,
      messagesSynced: totalMessagesSynced,
      totalMessages: stats.totalMessages,
      totalConversations: stats.totalConversations,
      fetchConfig: {
        deepSync,
        maxConversationPages,
        maxMessagesPerConversationPages,
        maxSentPages,
        conversationPageLimit,
        messagesPageLimit,
      },
      storageMode: MessengerAccountsService.getStorageMode(),
      warnings,
      warning: warnings[0] || null,
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
