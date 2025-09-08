import OpenAI from "openai";
import { supabase } from '../../supabase/server.supabase';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
});

export class AssistantThreadService {
    private static async getThreadId(phone: string, companyId: string): Promise<string | null> {
        const { data } = await supabase
            .from("conversations")
            .select("thread_id")
            .eq("phone", phone)
            .eq("company_id", companyId)
            .maybeSingle();

        return data?.thread_id || null;
    }

    private static async saveThreadId(phone: string, companyId: string, threadId: string): Promise<void> {
        await supabase
            .from("conversations")
            .upsert({
                phone,
                company_id: companyId,
                thread_id: threadId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: "phone,company_id"
            });
    }

    public static async getOrCreateThread(phone: string, companyId: string): Promise<string> {
        let threadId = await this.getThreadId(phone, companyId);

        if (!threadId) {
            const thread = await openai.beta.threads.create();
            threadId = thread.id;
            await this.saveThreadId(phone, companyId, threadId);
            console.log(`✅ Nuevo thread creado: ${threadId} para ${phone}`);
        }

        return threadId;
    }

    public static async sendMessage(
        phone: string,
        companyId: string,
        userMessage: string,
        assistantId: string
    ): Promise<string> {
        if (!assistantId || assistantId === "your_assistant_id_here") {
            throw new Error("OPENAI_ASSISTANT_ID no está configurado correctamente");
        }

        // 1) Obtener o crear thread
        const threadId = await this.getOrCreateThread(phone, companyId);

        // 2) Agregar mensaje del usuario al hilo
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: userMessage,
        });

        // 3) Ejecutar el run con streaming (sin bucles de retrieve)
        let responseText = "";
        try {
            const stream = await openai.beta.threads.runs.create(threadId, {
                assistant_id: assistantId,
                stream: true, // <- clave para evitar polling
            });

            // 4) Leer el stream
            for await (const event of stream as any) {
                // Texto que llega de a pedacitos
                if (
                    event?.event === "thread.message.delta" &&
                    Array.isArray(event?.data?.delta?.content)
                ) {
                    for (const part of event.data.delta.content) {
                        if (part.type === "text" && part.text?.value) {
                            responseText += part.text.value;
                        }
                    }
                }

                // Errores terminales dentro del stream
                if (event?.event === "thread.run.failed") {
                    const reason =
                        event?.data?.last_error?.message ?? "Run failed (unknown reason)";
                    throw new Error(reason);
                }
            }
        } catch (err: any) {
            // Si el stream no devolvió texto, hacemos fallback a leer el último mensaje
            console.warn("Stream error/fallback:", err?.message ?? err);
        }

        // 5) Fallback robusto: leer el último mensaje del asistente si no hubo texto
        if (!responseText) {
            const msgs = await openai.beta.threads.messages.list(threadId, {
                order: "desc", // asegura el más reciente primero
                limit: 10,
            });
            const assistantMsg = msgs.data.find((m: any) => m.role === "assistant");

            if (assistantMsg?.content?.length) {
                const textPart = assistantMsg.content.find((c: any) => c.type === "text");
                console.log("textPart", textPart);
                responseText = textPart.type ?? "";
            }
        }

        return responseText || "⚠ No hubo respuesta de texto";
    }
}