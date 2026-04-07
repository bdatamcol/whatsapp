import { supabase } from '@/lib/supabase/server.supabase';
import { promises as fs } from 'fs';
import path from 'path';

export interface MessengerMessage {
  id: string;
  senderId: string;
  pageId: string;
  text: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  senderName?: string;
  companyId?: string;
}

// Fallback local (archivo + memoria) por si la tabla no existe
const messagesStore: Map<string, MessengerMessage[]> = new Map();
const LOCAL_STORE_DIR = path.join(process.cwd(), '.local-store');
const LOCAL_STORE_FILE = path.join(LOCAL_STORE_DIR, 'messenger_messages.json');
let localStoreLoaded = false;

type DbMessageRow = {
  fb_message_id: string;
  sender_id: string;
  page_id: string;
  message_text: string | null;
  timestamp_ms: number;
  direction: 'incoming' | 'outgoing';
  sender_name: string | null;
  company_id: string | null;
};

let dbUnavailable = false;
let lastDbError: string | null = null;

function extractErrorText(error: any): string {
  if (!error) return 'unknown_error';
  if (typeof error === 'string') return error;
  return (
    error.message ||
    error.details ||
    error.hint ||
    error.code ||
    JSON.stringify(error)
  );
}

function shouldDisableDb(error: any): boolean {
  const code = String(error?.code || '');
  const text = `${extractErrorText(error)} ${error?.details || ''}`.toLowerCase();

  return (
    code === '42P01' ||
    code === 'PGRST204' ||
    code === '42P10' ||
    text.includes('does not exist') ||
    text.includes('schema cache') ||
    text.includes('relation')
  );
}

function mapDbToMessage(row: DbMessageRow): MessengerMessage {
  return {
    id: row.fb_message_id,
    senderId: row.sender_id,
    pageId: row.page_id,
    text: row.message_text || '',
    timestamp: row.timestamp_ms,
    type: row.direction,
    senderName: row.sender_name || undefined,
    companyId: row.company_id || undefined,
  };
}

function saveMessageInMemory(message: MessengerMessage): void {
  const key = `${message.pageId}_${message.senderId}`;

  if (!messagesStore.has(key)) {
    messagesStore.set(key, []);
  }

  const list = messagesStore.get(key)!;
  const exists = list.some((m) => m.id === message.id);
  if (exists) return;

  list.push(message);

  if (list.length > 200) {
    messagesStore.set(key, list.slice(-200));
  }
}

function buildMapFromObject(raw: Record<string, MessengerMessage[]>): Map<string, MessengerMessage[]> {
  const map = new Map<string, MessengerMessage[]>();
  for (const [key, messages] of Object.entries(raw || {})) {
    map.set(key, Array.isArray(messages) ? messages : []);
  }
  return map;
}

function buildObjectFromMap(map: Map<string, MessengerMessage[]>): Record<string, MessengerMessage[]> {
  const obj: Record<string, MessengerMessage[]> = {};
  for (const [key, messages] of map.entries()) {
    obj[key] = messages;
  }
  return obj;
}

async function ensureLocalStoreLoaded(): Promise<void> {
  if (localStoreLoaded) return;

  try {
    const fileContent = await fs.readFile(LOCAL_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent) as Record<string, MessengerMessage[]>;
    const loaded = buildMapFromObject(parsed);
    messagesStore.clear();
    for (const [key, value] of loaded.entries()) {
      messagesStore.set(key, value);
    }
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.warn('[messenger] Error leyendo almacenamiento local:', extractErrorText(error));
    }
  }

  localStoreLoaded = true;
}

async function persistLocalStore(): Promise<void> {
  try {
    await fs.mkdir(LOCAL_STORE_DIR, { recursive: true });
    const payload = JSON.stringify(buildObjectFromMap(messagesStore));
    await fs.writeFile(LOCAL_STORE_FILE, payload, 'utf-8');
  } catch (error) {
    console.warn('[messenger] Error guardando almacenamiento local:', extractErrorText(error));
  }
}

async function saveMessageLocal(message: MessengerMessage): Promise<void> {
  await ensureLocalStoreLoaded();
  saveMessageInMemory(message);
  await persistLocalStore();
}

async function getMessagesLocal(pageId: string, senderId: string): Promise<MessengerMessage[]> {
  await ensureLocalStoreLoaded();
  const key = `${pageId}_${senderId}`;
  return messagesStore.get(key) || [];
}

async function getConversationsLocal(pageId: string): Promise<Map<string, MessengerMessage[]>> {
  await ensureLocalStoreLoaded();
  const conversations = new Map<string, MessengerMessage[]>();

  for (const [key, messages] of messagesStore) {
    if (key.startsWith(`${pageId}_`)) {
      const senderId = key.replace(`${pageId}_`, '');
      conversations.set(senderId, messages);
    }
  }

  return conversations;
}

async function getAllMessagesLocal(pageId: string): Promise<MessengerMessage[]> {
  await ensureLocalStoreLoaded();
  const allMessages: MessengerMessage[] = [];

  for (const [key, messages] of messagesStore) {
    if (key.startsWith(`${pageId}_`)) {
      allMessages.push(...messages);
    }
  }

  return allMessages;
}

async function clearPageMessagesLocal(pageId: string): Promise<void> {
  await ensureLocalStoreLoaded();
  const keysToDelete: string[] = [];

  for (const key of messagesStore.keys()) {
    if (key.startsWith(`${pageId}_`)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => messagesStore.delete(key));
  await persistLocalStore();
}

export class MessengerAccountsService {
  static getStorageMode(): 'db' | 'local' {
    return dbUnavailable ? 'local' : 'db';
  }

  static getLastDbError(): string | null {
    return lastDbError;
  }

  static getPageAccessToken(pageId: string): string | null {
    const specificToken = process.env[`FACEBOOK_PAGE_TOKEN_${pageId}`];
    if (specificToken && specificToken !== 'TU_TOKEN_AQUI') {
      return specificToken;
    }

    const generalPageToken = process.env.FACEBOOK_PAGE_TOKEN;
    if (generalPageToken && generalPageToken !== 'TU_TOKEN_AQUI') {
      return generalPageToken;
    }

    const generalAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (generalAccessToken && generalAccessToken !== 'TU_TOKEN_AQUI') {
      return generalAccessToken;
    }

    return null;
  }

  static async saveMessage(message: MessengerMessage): Promise<void> {
    await saveMessageLocal(message);

    if (dbUnavailable) return;

    const { error } = await supabase
      .from('messenger_messages')
      .upsert(
        {
          fb_message_id: message.id,
          sender_id: message.senderId,
          page_id: message.pageId,
          message_text: message.text || '',
          timestamp_ms: message.timestamp,
          direction: message.type,
          sender_name: message.senderName || null,
          company_id: message.companyId || null,
        },
        { onConflict: 'page_id,fb_message_id' }
      );

    if (error) {
      lastDbError = extractErrorText(error);
      if (shouldDisableDb(error)) {
        dbUnavailable = true;
        console.warn('[messenger] DB no disponible para messenger_messages. Usando almacenamiento local. Error:', extractErrorText(error));
        return;
      }

      console.warn('[messenger] Error guardando mensaje en DB:', extractErrorText(error));
    }
  }

  static async getMessages(pageId: string, senderId: string): Promise<MessengerMessage[]> {
    if (!dbUnavailable) {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select('fb_message_id,sender_id,page_id,message_text,timestamp_ms,direction,sender_name,company_id')
        .eq('page_id', pageId)
        .eq('sender_id', senderId)
        .order('timestamp_ms', { ascending: true });

      if (!error && data) {
        return (data as DbMessageRow[]).map(mapDbToMessage);
      }

      if (error && shouldDisableDb(error)) {
        lastDbError = extractErrorText(error);
        dbUnavailable = true;
      }
    }

    return getMessagesLocal(pageId, senderId);
  }

  static async getConversationsByPage(pageId: string): Promise<Map<string, MessengerMessage[]>> {
    if (!dbUnavailable) {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select('fb_message_id,sender_id,page_id,message_text,timestamp_ms,direction,sender_name,company_id')
        .eq('page_id', pageId)
        .order('timestamp_ms', { ascending: true });

      if (!error && data) {
        const grouped = new Map<string, MessengerMessage[]>();

        for (const row of data as DbMessageRow[]) {
          const msg = mapDbToMessage(row);
          if (!grouped.has(msg.senderId)) {
            grouped.set(msg.senderId, []);
          }
          grouped.get(msg.senderId)!.push(msg);
        }

        return grouped;
      }

      if (error && shouldDisableDb(error)) {
        lastDbError = extractErrorText(error);
        dbUnavailable = true;
      }
    }

    return getConversationsLocal(pageId);
  }

  static async clearPageMessages(pageId: string): Promise<void> {
    await clearPageMessagesLocal(pageId);

    if (dbUnavailable) return;

    const { error } = await supabase
      .from('messenger_messages')
      .delete()
      .eq('page_id', pageId);

    if (error && shouldDisableDb(error)) {
      lastDbError = extractErrorText(error);
      dbUnavailable = true;
    }
  }

  static async getAllMessages(pageId: string): Promise<MessengerMessage[]> {
    if (!dbUnavailable) {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select('fb_message_id,sender_id,page_id,message_text,timestamp_ms,direction,sender_name,company_id')
        .eq('page_id', pageId)
        .order('timestamp_ms', { ascending: true });

      if (!error && data) {
        return (data as DbMessageRow[]).map(mapDbToMessage);
      }

      if (error && shouldDisableDb(error)) {
        lastDbError = extractErrorText(error);
        dbUnavailable = true;
      }
    }

    return getAllMessagesLocal(pageId);
  }

  static async getPageStats(pageId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastMessageAt?: number;
  }> {
    const allMessages = await this.getAllMessages(pageId);
    const conversations = new Set<string>();
    let lastMessageAt: number | undefined;

    for (const msg of allMessages) {
      conversations.add(msg.senderId);
      if (!lastMessageAt || msg.timestamp > lastMessageAt) {
        lastMessageAt = msg.timestamp;
      }
    }

    return {
      totalConversations: conversations.size,
      totalMessages: allMessages.length,
      lastMessageAt,
    };
  }
}
