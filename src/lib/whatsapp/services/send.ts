export async function sendMessageToWhatsApp({
    to,
    message,
    company,
}: {
    to: string;
    message: string;
    company: {
        phone_number_id: string;
        whatsapp_access_token: string;
    };
}) {
    const version = process.env.META_API_VERSION || 'v18.0';
    const url = `https://graph.facebook.com/${version}/${company.phone_number_id}/messages`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${company.whatsapp_access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
        }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Error enviando mensaje');
    return data.messages?.[0]?.id || crypto.randomUUID();
}
