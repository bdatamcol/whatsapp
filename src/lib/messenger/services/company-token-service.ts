import { getCompanyFacebookConfig } from '@/lib/marketing/services/company-ads';

export interface TokenVerificationResult {
    success: boolean;
    canSendMessages: boolean;
    missingPermissions: string[];
    recommendations: string[];
    error?: string;
    pageInfo?: {
        name: string;
        pageId: string;
    };
}

export class CompanyMessengerTokenService {

    private static getEnvPageToken(pageId: string): string | null {
        const envKey = `FACEBOOK_PAGE_TOKEN_${pageId}`;
        return process.env[envKey] || process.env.FACEBOOK_PAGE_TOKEN || null;
    }

    // Obtener el token de acceso para una página específica de la empresa
    static async getPageAccessToken(companyId: string, pageId: string): Promise<string | null> {
        try {
            // Primero intentar obtener el token desde variables de entorno
            const envToken = this.getEnvPageToken(pageId);
            if (envToken) {
                // Verificar que este token pertenece a la página solicitada
                const version = process.env.META_API_VERSION;
                const debugResponse = await fetch(
                    `https://graph.facebook.com/${version}/debug_token?input_token=${envToken}&access_token=${envToken}`
                );

                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    if (debugData.data?.profile_id === pageId) {
                        return envToken;
                    }
                }
            }

            // Fallback a la configuración de la empresa
            const config = await getCompanyFacebookConfig(companyId);

            if (!config.facebook_access_token) {
                throw new Error('La empresa no tiene configuración de Facebook');
            }

            // Obtener todas las páginas de la empresa
            const version = process.env.META_API_VERSION;
            const url = `https://graph.facebook.com/${version}/me/accounts?fields=id,access_token&access_token=${config.facebook_access_token}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error?.message || 'Error al obtener páginas');
            }

            // Buscar el token para la página específica
            const page = data.data?.find((p: any) => p.id === pageId);
            return page?.access_token || null;

        } catch (error) {
            console.error('Error obteniendo token de página:', error);
            return null;
        }
    }

    // Verificar el token de una página específica
    static async verifyPageToken(companyId: string, pageId: string): Promise<TokenVerificationResult> {
        try {
            const accessToken = await this.getPageAccessToken(companyId, pageId);

            if (!accessToken) {
                return {
                    success: false,
                    canSendMessages: false,
                    missingPermissions: [],
                    recommendations: [
                        'No se encontró un token de acceso para esta página',
                        'Verifica que la página esté correctamente vinculada a la cuenta de Facebook',
                        'Consulta la configuración de Facebook en la empresa',
                        'También puedes configurar la variable de entorno FACEBOOK_PAGE_TOKEN o FACEBOOK_PAGE_TOKEN_<PAGE_ID>'
                    ],
                    error: 'Token no encontrado'
                };
            }

            // Verificar el token con Facebook Graph API
            const version = process.env.META_API_VERSION;
            const response = await fetch(`https://graph.facebook.com/${version}/${pageId}?fields=name&access_token=${accessToken}`);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error verificando token:', errorData);

                return {
                    success: false,
                    canSendMessages: false,
                    missingPermissions: [],
                    recommendations: [
                        'El token proporcionado no es válido',
                        'Verifica que el token tenga los permisos necesarios',
                        'Asegúrate de que el token pertenezca a la página correcta',
                        'Si usas variables de entorno, verifica que FACEBOOK_PAGE_TOKEN sea correcto'
                    ],
                    error: errorData.error?.message || 'Token inválido'
                };
            }

            // Verificar permisos específicos
            const permissionsResponse = await fetch(`https://graph.facebook.com/${version}/me/permissions?access_token=${accessToken}`);
            const permissionsData = await permissionsResponse.json();

            const requiredPermissions = [
                'pages_messaging',
                'pages_read_engagement',
                'pages_manage_metadata'
            ];

            const grantedPermissions = permissionsData.data || [];
            const missingPermissions = requiredPermissions.filter(
                perm => !grantedPermissions.some((p: any) => p.permission === perm && p.status === 'granted')
            );

            const canSendMessages = missingPermissions.length === 0;

            let recommendations = [];

            if (canSendMessages) {
                recommendations = [
                    '✅ El token está correctamente configurado',
                    '✅ Todos los permisos necesarios están concedidos',
                    '✅ Puedes enviar mensajes desde esta página'
                ];
            } else {
                recommendations = [
                    `❌ Permisos faltantes: ${missingPermissions.join(', ')}`,
                    'Por favor, actualiza los permisos del token en Facebook Developers',
                    'Consulta la documentación para instrucciones detalladas',
                    'Si usas variables de entorno, asegúrate de que el token tenga todos los permisos necesarios'
                ];
            }

            const pageInfo = await response.json();

            return {
                success: true,
                canSendMessages,
                missingPermissions,
                recommendations,
                pageInfo: {
                    name: pageInfo.name,
                    pageId
                }
            };

        } catch (error: any) {
            console.error('Error en verifyPageToken:', error);
            return {
                success: false,
                canSendMessages: false,
                missingPermissions: [],
                recommendations: [
                    'Error al verificar el token',
                    'Verifica la configuración de Facebook de la empresa',
                    'También puedes usar variables de entorno para los tokens de página',
                    error.message || 'Error desconocido'
                ],
                error: error.message || 'Error interno'
            };
        }
    }
}