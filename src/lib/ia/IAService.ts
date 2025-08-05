import { askOpenAIWithHistory } from './providers/openai';
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
        return await askOpenAIWithHistory([{ role: 'user', content: message }]);
      case 'openrouter':
      default:
        return await askOpenRouterWithHistory([{ role: 'user', content: message }]);
    }
  }

  /**
   * Procesa el mensaje con historial e IA.
   * @param phone Número de teléfono del contacto
   * @param message Mensaje del usuario
   * @param company Objeto con el id de la copañia
   */
  public static async askSmart(phone: string, message: string, company:{ id: string }): Promise<string> {
    const now = new Date().toISOString();

    const systemPrompt = await getPromptByEmpresaId(company.id);
    const history = await getConversation(phone, company.id);
    const hasSystemPrompt = history.some(m => m.role === 'system');

    const filtered = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-4); // últimas 2 rondas

    const inputMessages = [
      ...(hasSystemPrompt ? [] : [{ role: 'system', content: systemPrompt }]),
      ...filtered,
      { role: 'user', content: message },
    ];

    const response = await askOpenAIWithHistory(inputMessages);

    const updated = [
      ...history,
      ...(hasSystemPrompt ? [] : [{
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
      },
    ];

    await updateConversation(phone, updated, company);
    return response;
  }
}

export default IAService;