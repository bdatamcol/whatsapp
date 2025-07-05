const token = process.env.WHATSAPP_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const baseUrl = 'https://graph.facebook.com';
const version = process.env.WHATSAPP_API_VERSION || 'v23.0';

export async function sendTextMessageToWhatsApp(phone: string, message: string) {
    const res = await fetch(`${baseUrl}/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.error?.message || 'Error enviando mensaje');
    }

    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    return messageId;
}
