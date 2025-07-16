export async function askOpenRouterWithHistory(
    history: { role: string; content: string }[],
): Promise<string> {
    try {
        const res = await fetch(process.env.OPENROUTER_BASE_URL!, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'gpt-4o',
                messages: history, // El system prompt ya viene si es necesario
                max_tokens: 50, // puedes ajustar según tu estrategia
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