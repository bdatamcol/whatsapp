type Campaign = {
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: string;
    start_time?: string;
    stop_time?: string;
};

export async function getFacebookCampaigns(options: { limit?: number; after?: string; getSummary?: boolean; filterStatus?: string } = {}): Promise<any> {
    const { limit = 25, after, getSummary = false, filterStatus } = options;

    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN!;
    const adAccountId = process.env.MARKETING_ACCOUNT_ID!;
    const version = process.env.META_API_VERSION || 'v17.0';

    let url = `https://graph.facebook.com/${version}/${adAccountId}/campaigns?`;

    if (!getSummary) {
        url += `fields=id,name,status,objective,daily_budget,start_time,stop_time&`;
    }

    url += `access_token=${accessToken}`;

    if (getSummary) {
        url += `&limit=0&summary=true`;
    } else {
        url += `&limit=${limit}`;
        if (after) url += `&after=${after}`;
    }

    if (filterStatus) {
        url += `&filtering=[{"field":"effective_status","operator":"IN","value":["${filterStatus}"]}]`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener campañas');
    }

    if (getSummary) {
        return { total: data.summary?.total_count || 0 };
    }

    return data;
}
