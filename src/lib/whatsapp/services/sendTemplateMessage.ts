export async function sendTemplateMessage({
    to,
    company,
    templateName = 'menu_inicial',
}: {
    to: string;
    company: {
        phone_number_id: string;
        whatsapp_access_token: string;
    };
    templateName?: string;
}) {
    const version = process.env.META_API_VERSION || 'v18.0';

    const response = await fetch(`https://graph.facebook.com/${version}/${company.phone_number_id}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${company.whatsapp_access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' }, // puedes hacerlo dinámico si quieres después
            },
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Error al enviar template: ${data.error?.message || 'Desconocido'}`);
    }

    return data;
}

