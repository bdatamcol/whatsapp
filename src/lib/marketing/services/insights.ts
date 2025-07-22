type Metric = {
    dateStart: string;
    dateStop: string;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    uniqueClicks: number;
    cpc: number;
    ctr: number;
    frequency: number;
    campaignName: string;
    adsetName: string;
    adName: string;
    effectiveStatus: string;
    actions: { actionType: string; value: number }[];
};

export async function getFacebookInsights(options: { limit?: number; after?: string; getTotalSpend?: boolean } = {}): Promise<any> {
    const { limit = 20, after = '', getTotalSpend = false } = options;

    const version = process.env.META_API_VERSION || 'v23.0';
    const baseUrl = `https://graph.facebook.com/${version}/act_${process.env.FACEBOOK_AD_ACCOUNT_ID}/insights`;

    const params = new URLSearchParams({
        fields: getTotalSpend ? 'spend' : 'date_start,date_stop,spend,impressions,reach,clicks,unique_clicks,cpc,ctr,frequency,campaign_name,adset_name,ad_name,actions',
        level: getTotalSpend ? 'account' : 'ad',
        access_token: process.env.FACEBOOK_ACCESS_TOKEN!,
    });

    if (getTotalSpend) {
        // Obtener moneda de la cuenta
        const accountUrl = `https://graph.facebook.com/${version}/act_${process.env.FACEBOOK_AD_ACCOUNT_ID}?fields=currency&access_token=${process.env.FACEBOOK_ACCESS_TOKEN!}`;
        const accountResponse = await fetch(accountUrl);
        if (!accountResponse.ok) throw new Error('Error al obtener moneda');
        const { currency: fromCurrency } = await accountResponse.json();

        // Último mes
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = lastMonth.getFullYear();
        const month = lastMonth.getMonth() + 1;
        const lastDay = new Date(year, month, 0).getDate();
        const since = `${year}-${month.toString().padStart(2, '0')}-01`;
        const until = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
        params.set('time_range', JSON.stringify({ since, until }));

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.error?.message || 'Error en la API de Facebook');
        }
        const raw = await response.json();
        const spend = parseFloat(raw.data[0]?.spend) || 0;

        // Convertir a COP
        const exchangeUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
        const exchangeResponse = await fetch(exchangeUrl);
        if (!exchangeResponse.ok) throw new Error('Error al obtener tasa de cambio');
        const exchangeData = await exchangeResponse.json();
        const rate = exchangeData.rates.COP || 0;
        const totalSpendInCOP = spend * rate;

        return { totalSpend: totalSpendInCOP };
    } else {
        params.append('limit', limit.toString());
        if (after) params.append('after', after);

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.error?.message || 'Error en la API de Facebook');
        }
        const raw = await response.json();

    const formattedData: Metric[] = raw.data.map((entry: any) => ({
        dateStart: entry.date_start || 'N/A',
        dateStop: entry.date_stop || 'N/A',
        spend: parseFloat(entry.spend) || 0,
        impressions: parseInt(entry.impressions) || 0,
        reach: parseInt(entry.reach) || 0,
        clicks: parseInt(entry.clicks) || 0,
        uniqueClicks: parseInt(entry.unique_clicks) || 0,
        cpc: parseFloat(entry.cpc) || 0,
        ctr: parseFloat(entry.ctr) || 0,
        frequency: parseFloat(entry.frequency) || 0,
        campaignName: entry.campaign_name || 'N/A',
        adsetName: entry.adset_name || 'N/A',
        adName: entry.ad_name || 'N/A',
        effectiveStatus: entry.effective_status || 'N/A',
        actions: entry.actions?.map((action: any) => ({
            actionType: action.action_type || 'N/A',
            value: parseInt(action.value) || 0,
        })) || [],
    }));

    return { data: formattedData, paging: raw.paging };
}
}
