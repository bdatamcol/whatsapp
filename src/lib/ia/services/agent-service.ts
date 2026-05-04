import { askWithResponsesAPI, saveAuditEntry, type AuditEntry } from "./responses-api-service";
import { updateConversation, getConversation } from "../memory";
import { supabase } from "@/lib/supabase/server.supabase";
import { sendMessageToWhatsApp } from "@/lib/whatsapp/services/send";

export async function processWithResponsesAPI(
    phone: string,
    companyId: string,
    userMessage: string,
    company: { id: string }
): Promise<string> {
    const { response, audit } = await askWithResponsesAPI(phone, companyId, userMessage);

    saveAuditEntry(audit).catch((e) =>
        console.error("[AgentService] Error guardando audit:", e)
    );

    const history = await getConversation(phone, companyId);
    const newMessages = [
        ...history,
        {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: userMessage,
            timestamp: new Date().toISOString(),
        },
        {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: response,
            timestamp: new Date().toISOString(),
            intent: audit.intent,
            confidence: audit.confidence,
            sources: audit.retrievedDocs,
        },
    ];

    await updateConversation(phone, newMessages, company);

    return response;
}
