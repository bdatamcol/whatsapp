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
    
    const version = process.env.META_API_VERSION || 'v17.0';
    let url = `https://graph.facebook.com/${version}/${config.marketing_account_id}/campaigns?`;
    
    if (!getSummary) {
        url += `fields=id,name,status,objective,daily_budget,start_time,stop_time&`;
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
    if (since && until) {
        url += `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`;
    } else if (since) {
        url += `&time_range=${encodeURIComponent(JSON.stringify({ since, until: new Date().toISOString().split('T')[0] }))}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener campañas de la empresa');
    }
    
    if (getSummary) {
        return { total: data.summary?.total_count || 0 };
    }
    
    return data;
}