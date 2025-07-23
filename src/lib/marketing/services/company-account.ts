import { getCompanyFacebookConfig } from './company-ads';

export type FacebookPage = {
    id: string;
    name: string;
    category: string;
    category_list: { id: string; name: string }[];
    link: string;
    picture: {
        data: {
            height: number;
            is_silhouette: boolean;
            url: string;
            width: number;
        };
    };
    access_token: string;
    fan_count?: number;
};

export async function getCompanyFacebookAccount(companyId: string): Promise<{
    id: string;
    name: string;
    picture: {
        data: {
            height: number;
            is_silhouette: boolean;
            url: string;
            width: number;
        };
    };
}> {
    // Obtener configuración de Facebook de la empresa
    const config = await getCompanyFacebookConfig(companyId);
    
    if (!config.facebook_access_token) {
        throw new Error('La empresa no tiene configuración de Facebook');
    }
    
    const version = process.env.META_API_VERSION || 'v17.0';
    const url = `https://graph.facebook.com/${version}/me?fields=id,name,picture&access_token=${config.facebook_access_token}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener cuenta de Facebook de la empresa');
    }
    
    return data;
}

export async function getCompanyFacebookPages(companyId: string): Promise<FacebookPage[]> {
    // Obtener configuración de Facebook de la empresa
    const config = await getCompanyFacebookConfig(companyId);
    
    if (!config.facebook_access_token) {
        throw new Error('La empresa no tiene configuración de Facebook');
    }
    
    const version = process.env.META_API_VERSION || 'v17.0';
    const url = `https://graph.facebook.com/${version}/me/accounts?fields=id,name,category,category_list,link,picture,access_token&access_token=${config.facebook_access_token}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Error al obtener páginas de Facebook de la empresa');
    }

    // Get fan count for each page using their individual access tokens
    const pagesWithFanCount = await Promise.all(
        data.data.map(async (page: FacebookPage) => {
            if (!page.access_token) return page;

            try {
                const fanCountUrl = `https://graph.facebook.com/${version}/${page.id}?fields=fan_count&access_token=${page.access_token}`;
                const fanCountResponse = await fetch(fanCountUrl);
                const fanCountData = await fanCountResponse.json();

                return {
                    ...page,
                    fan_count: fanCountData.fan_count ?? 0
                };
            } catch (error) {
                console.error(`Error getting fan count for page ${page.name}:`, error);
                return page;
            }
        })
    );
    
    return pagesWithFanCount || [];
}