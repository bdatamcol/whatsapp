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
        if (!assistantId || assistantId === 'your_assistant_id_here') {
            throw new Error("OPENAI_ASSISTANT_ID no está configurado correctamente");
        }
        const threadId = await this.getOrCreateThread(phone, companyId);

        try {
            // Agregar mensaje del usuario al hilo
            await openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: userMessage
            });

            // Crear y ejecutar el run
            const run = await openai.beta.threads.runs.create(threadId, {
                assistant_id: assistantId
            });

            // Esperar a que termine
            let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
            while (runStatus.status !== "completed") {
                if (runStatus.status === "failed" || runStatus.status === "cancelled") {
                    throw new Error(`Run failed with status: ${runStatus.status}`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
            }

            // Obtener respuesta
            const messages = await openai.beta.threads.messages.list(threadId);
            const lastMessage = messages.data[0];

            return lastMessage?.content?.[0]?.type === "text"
                ? lastMessage.content[0].text.value
                : "⚠ No hubo respuesta de texto";
        } catch (error) {
            if (error.status === 404 && error.message.includes('threads')) {
                throw new Error(`Assistant ID inválido: ${assistantId}. Verifica tu configuración en OpenAI.`);
            }
            throw error;
        }

    }
}