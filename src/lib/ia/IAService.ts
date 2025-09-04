import { getConversation, updateConversation } from './memory';
import { getPromptByEmpresaId } from './promptConfig';
import { AssistantThreadService } from './providers/assistantThreadService';

class IAService {
    public static async askSmart(
        phone: string, 
        message: string, 
        company: { id: string }
    ): Promise<string> {
        const now = new Date().toISOString();
        
        // Obtener prompt del sistema para la empresa
        const systemPrompt = await getPromptByEmpresaId(company.id);
        
        // Obtener o crear el thread_id
        const threadId = await AssistantThreadService.getOrCreateThread(phone, company.id);
        
        // Guardar mensaje del usuario en la base de datos (mantener historial local)
        const history = await getConversation(phone, company.id);
        const updatedHistory = [
            ...history,
            {
                id: `user-${Date.now()}`,
                role: 'user',
                content: message,
                timestamp: now,
            }
        ];

        // Enviar solo el mensaje actual al assistant (no todo el historial)
        const response = await AssistantThreadService.sendMessage(
            phone,
            company.id,
            message,
            process.env.OPENAI_ASSISTANT_ID!
        );

        // Guardar respuesta en la base de datos con el thread_id
        const finalHistory = [
            ...updatedHistory,
            {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString(),
                status: 'sent',
            }
        ];

        // Asegurar que el thread_id se guarda en la base de datos
        await updateConversation(phone, finalHistory, company, threadId);
        return response;
    }

    // Método legacy para compatibilidad
    public static async ask(message: string): Promise<string> {
        return "Este método está obsoleto. Usa askSmart() en su lugar.";
    }
}

export default IAService;