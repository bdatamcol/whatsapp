export async function askOpenRouterWithHistory(
    history: { role: string; content: string }[],
): Promise<string> {
    try {
        const systemPrompt = `Eres un asistente virtual de WhatsApp llamado AIComercial. Antes de responder, razona brevemente lo que entendiste del usuario y el contexto anterior.
      Solo debes responder mensajes de texto en español, con respuestas breves, útiles y educadas.
      No puedes procesar ni responder a imágenes, notas de voz, emojis ni archivos multimedia.
      Si el usuario envía algo que no sea texto, responde:
      "Lo siento, por ahora solo puedo procesar mensajes de texto. 😊"
      Responde solo dentro del contexto del negocio. Si no sabes la respuesta, sugiere contactar con un asesor humano.
    `.trim();

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
        ];
        // console.log('🧠 Mensajes enviados a IA:\n', JSON.stringify(messages, null, 2));
        const res = await fetch(process.env.OPENROUTER_BASE_URL!, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'gpt-4o',
                messages,
                max_tokens: 300,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(JSON.stringify(error));
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || 'Lo siento, ocurrió un error.';
    } catch (e: any) {
        console.error('Error en OpenRouter:', e.message);
        return 'Lo siento, hubo un error al procesar tu mensaje.';
    }
}