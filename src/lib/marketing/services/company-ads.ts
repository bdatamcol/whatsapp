import { supabase } from '@/lib/supabase/server.supabase';
import crypto from 'crypto';

// Función para descifrar datos
function decryptData(encryptedText: string, secretKey: string): string {
    try {
        if (!encryptedText || typeof encryptedText !== 'string') {
            return encryptedText;
        }

        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            return encryptedText;
        }

        const [ivHex, encryptedHex] = parts;

        if (!ivHex || !encryptedHex || !/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
            return encryptedText;
        }

        if (!secretKey || secretKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(secretKey)) {
            console.warn('[company-ads] Clave de cifrado inválida');
            return encryptedText;
        }

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.warn('[company-ads] Error al descifrar datos:', error);
        return encryptedText;
    }
}

// Función para obtener configuración de Facebook de una empresa específica
export async function getCompanyFacebookConfig(companyId: string) {
    const { data: company, error } = await supabase
        .from('companies')
        .select('meta_app_id, facebook_access_token, facebook_ad_account_id, marketing_account_id')
        .eq('id', companyId)
        .maybeSingle();

    if (error || !company) {
        throw new Error('No se encontró la configuración de Facebook para esta empresa');
    }

    const secretKey = process.env.ENCRYPTION_KEY || '';

    // Descifrar campos si están cifrados
    if (secretKey) {
        if (company.facebook_access_token && company.facebook_access_token.includes(':')) {
            company.facebook_access_token = decryptData(company.facebook_access_token, secretKey);
        }
        if (company.meta_app_id && company.meta_app_id.includes(':')) {
            company.meta_app_id = decryptData(company.meta_app_id, secretKey);
        }
        if (company.facebook_ad_account_id && company.facebook_ad_account_id.includes(':')) {
            company.facebook_ad_account_id = decryptData(company.facebook_ad_account_id, secretKey);
        }
        if (company.marketing_account_id && company.marketing_account_id.includes(':')) {
            company.marketing_account_id = decryptData(company.marketing_account_id, secretKey);
        }
    }

    return company;
}

export async function getCompanyFacebookCampaigns(
    companyId: string,
    options: { limit?: number; after?: string; getSummary?: boolean; filterStatus?: string; since?: string; until?: string } = {}
): Promise<any> {
    const { limit = 25, after, getSummary = false, filterStatus, since, until } = options;

    // Obtener configuración de Facebook de la empresa
    const config = await getCompanyFacebookConfig(companyId);

    if (!config.facebook_access_token || !config.marketing_account_id) {
        throw new Error('La empresa no tiene configuración de Facebook completa');
    }

    const version = process.env.META_API_VERSION;
    let url = `https://graph.facebook.com/${version}/${config.marketing_account_id}/campaigns?`;

    if (!getSummary) {
        url += `fields=id,name,status,effective_status,objective,daily_budget,start_time,stop_time&`;
    }

    url += `access_token=${config.facebook_access_token}`;

    if (getSummary) {
        url += `&limit=0&summary=true`;
    } else {
        url += `&limit=${limit}`;
        if (after) url += `&after=${after}`;
    }

    // Agregar filtros
    const filters = [];

    if (filterStatus) {
        filters.push(`{"field":"effective_status","operator":"IN","value":["${filterStatus}"]}`);
    }

    if (filters.length > 0) {
        url += `&filtering=[${filters.join(',')}]`;
    }

    // Para filtros de fecha, usar time_range
    // if (since && until) {
    //     url += `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`;
    // } else if (since) {
    //     url += `&time_range=${encodeURIComponent(JSON.stringify({ since, until: new Date().toISOString().split('T')[0] }))}`;
    // }
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener campañas de la empresa');
    }

    if (getSummary) {
        return { total: data.summary?.total_count || 0 };
    }

    if (data.data && Array.isArray(data.data)) {
        const uniqueCampaigns = Array.from(
            new Map(data.data.map((c: any) => [c.id, c])).values()
        );
        data.data = uniqueCampaigns;
    }

    return data;
}

export async function getCompanyFacebookAdSets(
    companyId: string,
    campaignId: string,
    options: { limit?: number; after?: string; filterStatus?: string } = {}
): Promise<any> {
    const { limit = 25, after, filterStatus } = options;
    const config = await getCompanyFacebookConfig(companyId);
    const version = process.env.META_API_VERSION;

    let url = `https://graph.facebook.com/${version}/${campaignId}/adsets?`;
    url += `fields=id,name,status,daily_budget,start_time,end_time,targeting&`;
    url += `access_token=${config.facebook_access_token}`;
    url += `&limit=${limit}`;

    if (after) url += `&after=${after}`;

    if (filterStatus) {
        url += `&filtering=[{"field":"effective_status","operator":"IN","value":["${filterStatus}"]}]`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener conjuntos de anuncios');
    }

    return data;
}

export async function getCompanyFacebookAds(
    companyId: string,
    adSetId: string,
    options: { limit?: number; after?: string; filterStatus?: string } = {}
): Promise<any> {
    const { limit = 25, after, filterStatus } = options;
    const config = await getCompanyFacebookConfig(companyId);
    const version = process.env.META_API_VERSION;

    let url = `https://graph.facebook.com/${version}/${adSetId}/ads?`;
    url += `fields=id,name,status,creative{id,name,thumbnail_url},preview_shareable_link&`;
    url += `access_token=${config.facebook_access_token}`;
    url += `&limit=${limit}`;

    if (after) url += `&after=${after}`;

    if (filterStatus) {
        url += `&filtering=[{"field":"effective_status","operator":"IN","value":["${filterStatus}"]}]`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener anuncios');
    }

    return data;
}

export async function getCompanyFacebookLeadsFromAd(
    companyId: string,
    adId: string,
    options: { limit?: number; after?: string } = {}
): Promise<any> {
    const { limit = 50, after } = options;
    const config = await getCompanyFacebookConfig(companyId);
    const version = process.env.META_API_VERSION;

    let url = `https://graph.facebook.com/${version}/${adId}/leads?`;
    url += `fields=id,created_time,field_data,campaign_name,adset_name,ad_name&`;
    url += `access_token=${config.facebook_access_token}`;
    url += `&limit=${limit}`;

    if (after) url += `&after=${after}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener leads del anuncio');
    }

    return data;
}

export async function getCompanyFacebookLead(
    companyId: string,
    leadId: string
): Promise<any> {
    const config = await getCompanyFacebookConfig(companyId);
    const version = process.env.META_API_VERSION;

    const url = `https://graph.facebook.com/${version}/${leadId}?fields=id,created_time,field_data,campaign_name,adset_name,ad_name,form_id&access_token=${config.facebook_access_token}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener detalle del lead');
    }

    return data;
}

function extractLeadsFromActions(actions: Array<{ action_type?: string; value?: string | number }> = []): number {
    return actions.reduce((acc, action) => {
        const type = (action.action_type || '').toLowerCase();
        const value = Number(action.value || 0);
        if (!Number.isFinite(value)) return acc;
        if (type.includes('lead')) return acc + value;
        return acc;
    }, 0);
}

export async function getCompanyFacebookCampaignInsights(
    companyId: string,
    campaignId: string,
    options: { since?: string; until?: string } = {}
): Promise<any> {
    const { since, until } = options;
    const config = await getCompanyFacebookConfig(companyId);
    const version = process.env.META_API_VERSION;

    let url = `https://graph.facebook.com/${version}/${campaignId}/insights?fields=spend,impressions,reach,clicks,cpc,ctr,frequency,actions&access_token=${config.facebook_access_token}`;

    if (since && until) {
        url += `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener insights de la campaña');
    }

    const row = data.data?.[0] || {};
    const leads = extractLeadsFromActions(row.actions || []);

    return {
        spend: Number(row.spend || 0),
        impressions: Number(row.impressions || 0),
        reach: Number(row.reach || 0),
        clicks: Number(row.clicks || 0),
        cpc: Number(row.cpc || 0),
        ctr: Number(row.ctr || 0),
        frequency: Number(row.frequency || 0),
        leads,
    };
}

export async function getCompanyFacebookCampaignAds(
    companyId: string,
    campaignId: string,
    options: { limit?: number; after?: string } = {}
): Promise<any> {
    const { limit = 50, after } = options;
    const config = await getCompanyFacebookConfig(companyId);
    const version = process.env.META_API_VERSION;

    let url = `https://graph.facebook.com/${version}/${campaignId}/ads?fields=id,name,status,effective_status,creative{id,name,thumbnail_url},preview_shareable_link,insights{impressions,reach,clicks,spend,ctr,cpc,actions}&limit=${limit}&access_token=${config.facebook_access_token}`;
    if (after) url += `&after=${after}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener anuncios de la campaña');
    }

    const ads = (data.data || []).map((ad: any) => {
        const insight = ad.insights?.data?.[0] || {};
        const leads = extractLeadsFromActions(insight.actions || []);
        return {
            id: ad.id,
            name: ad.name,
            status: ad.status,
            effective_status: ad.effective_status,
            creative: ad.creative,
            preview_shareable_link: ad.preview_shareable_link,
            metrics: {
                impressions: Number(insight.impressions || 0),
                reach: Number(insight.reach || 0),
                clicks: Number(insight.clicks || 0),
                spend: Number(insight.spend || 0),
                ctr: Number(insight.ctr || 0),
                cpc: Number(insight.cpc || 0),
                leads,
            },
        };
    });

    return {
        data: ads,
        paging: data.paging,
    };
}
