import { getCompanyFacebookConfig } from '@/lib/marketing/services/company-ads';

export interface FacebookMessengerPage {
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
}

export interface MessengerPageInfo {
  pageId: string;
  pageName: string;
  hasToken: boolean;
  stats: {
    totalConversations: number;
    totalMessages: number;
    lastMessageAt?: number | undefined;
  };
  source: 'env' | 'company';
}

// Helper function to get page tokens from environment variables
function getEnvPageTokens() {
  const tokens: Record<string, string> = {};

  // Check for FACEBOOK_PAGE_TOKEN (default)
  if (process.env.FACEBOOK_PAGE_TOKEN) {
    tokens['default'] = process.env.FACEBOOK_PAGE_TOKEN;
  }

  // Check for FACEBOOK_PAGE_TOKEN_XXXX pattern
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('FACEBOOK_PAGE_TOKEN_')) {
      const pageName = key.replace('FACEBOOK_PAGE_TOKEN_', '').toLowerCase();
      tokens[pageName] = process.env[key]!;
    }
  });

  return tokens;
}

// Helper function to get page info using a token
async function getPageInfoWithToken(pageId: string, accessToken: string) {
  try {
    const version = process.env.META_API_VERSION;
    const response = await fetch(
      `https://graph.facebook.com/${version}/${pageId}?fields=name,category,fan_count&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching page info for ${pageId}:`, error);
    return null;
  }
}

export async function getCompanyMessengerPages(companyId: string): Promise<MessengerPageInfo[]> {
  const allPages: MessengerPageInfo[] = [];

  try {
    // First, try to get pages from company configuration
    try {
      const config = await getCompanyFacebookConfig(companyId);

      if (config.facebook_access_token) {
        const version = process.env.META_API_VERSION;
        const url = `https://graph.facebook.com/${version}/me/accounts?fields=id,name,category,category_list,link,picture,access_token,fan_count&access_token=${config.facebook_access_token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.data) {
          const companyPages = await Promise.all(
            data.data.map(async (page: FacebookMessengerPage) => {
              if (!page.access_token) return null;

              try {
                // Verificar que la página tenga permisos de Messenger
                const messengerPermissionsUrl = `https://graph.facebook.com/${version}/${page.id}?fields=conversations,messages&access_token=${page.access_token}`;
                const messengerResponse = await fetch(messengerPermissionsUrl);

                if (!messengerResponse.ok) {
                  console.warn(`Página ${page.name} sin permisos de Messenger`);
                  return null;
                }

                return {
                  pageId: page.id,
                  pageName: page.name,
                  hasToken: true,
                  stats: {
                    totalConversations: 0,
                    totalMessages: 0,
                    lastMessageAt: undefined
                  },
                  source: 'company' as const
                };
              } catch (error) {
                console.error(`Error verificando página ${page.name}:`, error);
                return null;
              }
            })
          );

          const validPages = companyPages.filter(page => page !== null) as MessengerPageInfo[];
          allPages.push(...validPages);
        }
      }
    } catch (error) {
      console.warn('Could not fetch pages from company config:', error);
    }

    // Then, add pages from environment variables
    const envTokens = getEnvPageTokens();

    const envPages = await Promise.all(
      Object.entries(envTokens).map(async ([pageName, token]) => {
        try {
          // Get page ID from token
          const version = process.env.META_API_VERSION;
          const debugResponse = await fetch(
            `https://graph.facebook.com/${version}/debug_token?input_token=${token}&access_token=${token}`
          );

          if (!debugResponse.ok) {
            return null;
          }

          const debugData = await debugResponse.json();
          const pageId = debugData.data?.profile_id;

          if (!pageId) {
            return null;
          }

          // Get page info
          const pageInfo = await getPageInfoWithToken(pageId, token);
          if (!pageInfo) {
            return null;
          }

          return {
            pageId: pageId,
            pageName: pageName === 'default' ? pageInfo.name : `${pageInfo.name} (${pageName})`,
            hasToken: true,
            stats: {
              totalConversations: 0,
              totalMessages: 0,
              lastMessageAt: undefined
            },
            source: 'env' as const
          };
        } catch (error) {
          console.error(`Error processing env token for ${pageName}:`, error);
          return null;
        }
      })
    );

    const validEnvPages = envPages.filter(page => page !== null) as MessengerPageInfo[];
    allPages.push(...validEnvPages);

    // Remove duplicates based on pageId, prioritizing env tokens
    const uniquePages = allPages.reduce((acc, page) => {
      const existing = acc.find(p => p.pageId === page.pageId);
      if (!existing) {
        acc.push(page);
      } else if (page.source === 'env' && existing.source === 'company') {
        // Replace company token with env token if both exist
        const index = acc.findIndex(p => p.pageId === page.pageId);
        acc[index] = page;
      }
      return acc;
    }, [] as MessengerPageInfo[]);

    return uniquePages;

  } catch (error) {
    console.error('Error en getCompanyMessengerPages:', error);

    // Fallback to env tokens only if company config fails
    const envTokens = getEnvPageTokens();
    const envPages = await Promise.all(
      Object.entries(envTokens).map(async ([pageName, token]) => {
        try {
          const version = process.env.META_API_VERSION;
          const debugResponse = await fetch(
            `https://graph.facebook.com/${version}/debug_token?input_token=${token}&access_token=${token}`
          );

          if (!debugResponse.ok) {
            return null;
          }

          const debugData = await debugResponse.json();
          const pageId = debugData.data?.profile_id;

          if (!pageId) {
            return null;
          }

          const pageInfo = await getPageInfoWithToken(pageId, token);
          if (!pageInfo) {
            return null;
          }

          return {
            pageId: pageId,
            pageName: pageName === 'default' ? pageInfo.name : `${pageInfo.name} (${pageName})`,
            hasToken: true,
            stats: {
              totalConversations: 0,
              totalMessages: 0,
              lastMessageAt: undefined
            },
            source: 'env' as const
          };
        } catch (error) {
          console.error(`Error processing env token for ${pageName}:`, error);
          return null;
        }
      })
    );

    const validFallbackPages = envPages.filter(page => page !== null) as MessengerPageInfo[];
    return validFallbackPages;
  }
}

// Función auxiliar para obtener información de una página específica
export async function getCompanyMessengerPageInfo(
  companyId: string,
  pageId: string
): Promise<MessengerPageInfo | null> {
  try {
    const pages = await getCompanyMessengerPages(companyId);
    return pages.find(page => page.pageId === pageId) || null;
  } catch (error) {
    console.error('Error en getCompanyMessengerPageInfo:', error);
    return null;
  }
}