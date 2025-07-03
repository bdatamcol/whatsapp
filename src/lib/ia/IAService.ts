import { askOpenAI } from './providers/openai';
import { askOpenRouterWithHistory } from './providers/openrouter';
import { getConversation, updateConversation } from './memory';

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

  public static async askSmart(phone: string, message: string): Promise<string> {
    const history = await getConversation(phone);

    // Filtramos los últimos 2 pares útiles (user + assistant) con contenido real
    const filtered = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-4);// 2 pares de usuario y asistente

    const inputMessages = [
      ...filtered,
      { role: 'user', content: message }
    ];

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

    // Guardar nuevo par
    const updated = [...history, { role: 'user', content: message }, { role: 'assistant', content: response }];
    await updateConversation(phone, updated);

    return response;
  }
}

export default IAService;
