import { askOpenAI } from './providers/openai';
import { askOpenRouterWithHistory } from './providers/openrouter';
import { getConversation, updateConversation } from './memory';
import { getPromptByEmpresaId } from './promptConfig';

type Provider = 'openai' | 'openrouter';

class IAService {
  private static provider: Provider = process.env.IA_PROVIDER as Provider || 'openrouter';

  public static setProvider(provider: Provider) {
    this.provider = provider;
  }

  public static async ask(message: string): Promise<string> {
    switch (this.provider) {
      case 'openai':
        return await askOpenAI(message);
      case 'openrouter':
      default:
        return await askOpenRouterWithHistory([{ role: 'user', content: message }]);
    }
  }

  /**
   * Procesa el mensaje con historial e IA.
   * @param phone Número de teléfono del contacto
   * @param message Mensaje del usuario
   * @param empresaId ID de la empresa (para obtener prompt personalizado)
   */
  public static async askSmart(phone: string, message: string, empresaId = 'bdatam'): Promise<string> {
    const now = new Date().toISOString();

    // 1. Obtener prompt de empresa
    const systemPrompt = await getPromptByEmpresaId(empresaId);
    console.log(`📝 Prompt para empresa ${empresaId}: ${systemPrompt}`);
    if (!systemPrompt) {
      console.warn(`⚠️ No se encontró prompt para empresa ${empresaId}`);
    }

    // 2. Obtener historial y verificar si ya tiene prompt
    const history = await getConversation(phone);
    const hasSystemPrompt = history.some(m => m.role === 'system');
    console.log({hasSystemPrompt});

    // 3. Filtrar historial útil
    const filtered = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-4);

    // 4. Construir input para IA
    const inputMessages = [
      ...(hasSystemPrompt ? [] : [{ role: 'system', content: systemPrompt }]),
      ...filtered,
      { role: 'user', content: message }
    ];
    console.log(inputMessages);
    // 5. Consultar IA
    let response: string;
    switch (this.provider) {
      case 'openai':
        response = await askOpenAI(message);
        break;
      case 'openrouter':
      default:
        response = await askOpenRouterWithHistory(inputMessages);
        break;
    }

    // 6. Armar historial actualizado
    const updated = [
      ...history,
      ...(hasSystemPrompt
        ? []
        : [{
          id: `system-${Date.now()}`,
          role: 'system',
          content: systemPrompt,
          timestamp: now,
        }]),
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: now,
      },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: now,
        status: 'sent',
      }
    ];

    // 7. Guardar en Supabase
    await updateConversation(phone, updated);

    return response;
  }
}

export default IAService;



// import { askOpenAI } from './providers/openai';
// import { askOpenRouterWithHistory } from './providers/openrouter';
// import { getConversation, updateConversation } from './memory';

// type Provider = 'openai' | 'openrouter';

// class IAService {
//   private static provider: Provider = process.env.IA_PROVIDER as Provider || 'openrouter';

//   public static setProvider(provider: Provider) {
//     this.provider = provider;
//   }

//   public static async ask(message: string): Promise<string> {
//     switch (this.provider) {
//       case 'openai':
//         return await askOpenAI(message);
//       case 'openrouter':
//       default:
//         return await askOpenRouterWithHistory([{ role: 'user', content: message }]);
//     }
//   }

//   public static async askSmart(phone: string, message: string): Promise<string> {
//     const history = await getConversation(phone);

//     // Filtramos los últimos 2 pares útiles (user + assistant) con contenido real
//     const filtered = history
//       .filter(m => m.role === 'user' || m.role === 'assistant')
//       .slice(-4);// 2 pares de usuario y asistente

//     const inputMessages = [
//       ...filtered,
//       { role: 'user', content: message }
//     ];

//     let response: string;

//     switch (this.provider) {
//       case 'openai':
//         response = await askOpenAI(message);
//         break;
//       case 'openrouter':
//       default:
//         response = await askOpenRouterWithHistory(inputMessages);
//         break;
//     }

//     // Guardar nuevo par
//     const updated = [...history, { role: 'user', content: message }, { role: 'assistant', content: response }];
//     await updateConversation(phone, updated);

//     return response;
//   }
// }

// export default IAService;
