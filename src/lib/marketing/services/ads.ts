type Campaign = {
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: string;
    start_time?: string;
    stop_time?: string;
};

export async function getFacebookCampaigns(): Promise<Campaign[]> {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN!;
    const adAccountId = process.env.MARKETING_ACCOUNT_ID!;
    const version = process.env.META_API_VERSION || 'v17.0';

    const url = `https://graph.facebook.com/${version}/${adAccountId}/campaigns?` +
        `fields=id,name,status,objective,daily_budget,start_time,stop_time&access_token=${accessToken}`;

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener campañas');
    }

    return data.data as Campaign[];
}
