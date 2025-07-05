export async function sendTemplateMessage(to: string, phoneNumberId: string, templateName = 'menu_inicial') {
    const version = process.env.META_API_VERSION;
    const token = process.env.WHATSAPP_API_TOKEN;

    const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' },
            },
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Error al enviar template: ${data.error?.message || 'Desconocido'}`);
    }

    return data;
}
