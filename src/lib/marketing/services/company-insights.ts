import { getCompanyFacebookConfig } from './company-ads';

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

export async function getCompanyFacebookInsights(
    companyId: string,
    options: { limit?: number; after?: string; getTotalSpend?: boolean; since?: string; until?: string } = {}
): Promise<any> {
    const { limit = 20, after = '', getTotalSpend = false, since: optSince, until: optUntil } = options;

    // Obtener configuración de Facebook de la empresa
    const config = await getCompanyFacebookConfig(companyId);

    if (!config.facebook_access_token || !config.facebook_ad_account_id) {
        throw new Error('La empresa no tiene configuración de Facebook completa');
    }

    const version = process.env.META_API_VERSION || 'v23.0';
    const baseUrl = `https://graph.facebook.com/${version}/act_${config.facebook_ad_account_id}/insights`;

    const params = new URLSearchParams({
        fields: getTotalSpend ? 'spend' : 'date_start,date_stop,spend,impressions,reach,clicks,unique_clicks,cpc,ctr,frequency,campaign_name,adset_name,ad_name,actions',
        level: getTotalSpend ? 'account' : 'ad',
        access_token: config.facebook_access_token,
    });

    if (getTotalSpend) {
        // Obtener moneda de la cuenta
        const accountUrl = `https://graph.facebook.com/${version}/act_${config.facebook_ad_account_id}?fields=currency&access_token=${config.facebook_access_token}`;
        const accountResponse = await fetch(accountUrl);
        if (!accountResponse.ok) throw new Error('Error al obtener moneda de la empresa');
        const { currency: fromCurrency } = await accountResponse.json();
    
        // Usar fechas proporcionadas o default a último mes
        const now = new Date();
        let since = optSince;
        let until = optUntil;
        if (!since || !until) {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const year = lastMonth.getFullYear();
            const month = lastMonth.getMonth() + 1;
            const lastDay = new Date(year, month, 0).getDate();
            since = `${year}-${month.toString().padStart(2, '0')}-01`;
            until = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
        }
        params.append('time_range', JSON.stringify({ since, until }));
    
        const url = `${baseUrl}?${params.toString()}`;
        const response = await fetch(url);
        const raw = await response.json();
    
        if (!response.ok || raw.error) {
            throw new Error(raw.error?.message || 'Error al obtener gasto total de la empresa');
        }
    
        const totalSpend = raw.data?.[0]?.spend || '0';
    
        return {
            totalSpend: parseFloat(totalSpend),
            currency: 'COP',
            originalCurrency: fromCurrency,
            originalAmount: totalSpend
        };
    }
    // Para insights regulares, agregar time_range si se proporcionan fechas
    if (optSince && optUntil) {
        params.append('time_range', JSON.stringify({ since: optSince, until: optUntil }));
    }

    if (!getTotalSpend) {
        params.append('limit', limit.toString());
        if (after) params.append('after', after);
    }

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);
    const raw = await response.json();

    if (!response.ok || raw.error) {
        throw new Error(raw.error?.message || 'Error al obtener insights de la empresa');
    }

    const formattedData = raw.data?.map((entry: any): Metric => ({
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