import { getCompanyFacebookConfig } from '@/lib/marketing/services/company-ads';

export class CompanyMessengerAccountsService {

    // Obtener el token de acceso para una página específica de la empresa
    static async getPageAccessToken(companyId: string, pageId: string): Promise<string | null> {
        try {
            const config = await getCompanyFacebookConfig(companyId);

            if (!config.facebook_access_token) {
                return null;
            }

            const version = process.env.META_API_VERSION;
            const url = `https://graph.facebook.com/${version}/me/accounts?fields=id,access_token&access_token=${config.facebook_access_token}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.error) {
                console.error('Error obteniendo tokens de página:', data.error);
                return null;
            }

            // Buscar el token para la página específica
            const page = data.data?.find((p: any) => p.id === pageId);
            return page?.access_token || null;

        } catch (error) {
            console.error('Error en getPageAccessToken:', error);
            return null;
        }
    }

    // Obtener estadísticas de mensajes para una página
    static getPageStats(pageId: string) {
        // Esta función debería consultar la base de datos para obtener estadísticas reales
        // Por ahora, retornar estadísticas básicas
        return {
            totalConversations: 0,
            totalMessages: 0,
            lastMessageAt: undefined
        };
    }

    // Verificar si una página tiene token configurado para la empresa
    static async hasPageToken(companyId: string, pageId: string): Promise<boolean> {
        const token = await this.getPageAccessToken(companyId, pageId);
        return token !== null;
    }

    // Obtener todos los tokens de páginas para una empresa
    static async getAllPageTokens(companyId: string): Promise<Array<{ pageId: string, accessToken: string }>> {
        try {
            const config = await getCompanyFacebookConfig(companyId);

            if (!config.facebook_access_token) {
                return [];
            }

            const version = process.env.META_API_VERSION;
            const url = `https://graph.facebook.com/${version}/me/accounts?fields=id,access_token&access_token=${config.facebook_access_token}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.error) {
                console.error('Error obteniendo todos los tokens:', data.error);
                return [];
            }

            return data.data?.map((page: any) => ({
                pageId: page.id,
                accessToken: page.access_token
            })) || [];

        } catch (error) {
            console.error('Error en getAllPageTokens:', error);
            return [];
        }
    }
}