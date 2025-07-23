export async function askOpenAIWithHistory(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const res = await fetch(process.env.OPENAI_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano-2025-04-14',
        messages,
        max_tokens: 300, // puedes ajustar este valor
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error));
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Lo siento, ocurrió un error.';
  } catch (e: any) {
    console.error('Error en OpenAI:', e.message);
    return 'Lo siento, hubo un error con OpenAI.';
  }
}