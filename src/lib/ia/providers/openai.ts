

export async function askOpenAI(message: string): Promise<string> {
  try {
    const res = await fetch(process.env.OPENAI_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Responde como un asistente útil por WhatsApp. recuerda que solo tienes 100 tokens' },
          { role: 'user', content: message },
        ],
        max_tokens: 100,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error));
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } catch (e: any) {
    console.error('Error en OpenAI:', e.message);
    return 'Lo siento, hubo un error con OpenAI.';
  }
}
