const BASE_URL = 'https://graph.facebook.com';

const VERSION = process.env.META_API_VERSION || 'v17.0';
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN!;
const ACCOUNT_ID = process.env.MARKETING_ACCOUNT_ID!;


type FacebookPage = {
    id: string;
    name: string;
    category?: string;
    username?: string;
    access_token?: string;
    fan_count?: number;
    picture?: {
        data: {
            url: string;
        };
    };
};

export async function getMarketingAccountInfo() {
    // 1. Info del Ad Account
    const accountRes = await fetch(`${BASE_URL}/${VERSION}/${ACCOUNT_ID}?fields=name,account_status&access_token=${ACCESS_TOKEN}`);
    const accountData = await accountRes.json();

    if (!accountRes.ok) {
        throw new Error(accountData?.error?.message || 'Error al obtener la cuenta');
    }

    // 2. Lista de páginas asociadas
    const pagesRes = await fetch(
        `${BASE_URL}/${VERSION}/me/accounts?fields=id,name,category,username,access_token,picture{url}&access_token=${ACCESS_TOKEN}&force_token=page`
    );
    const pagesList = await pagesRes.json();

    if (!pagesRes.ok || !pagesList.data) {
        throw new Error(pagesList?.error?.message || 'No se encontraron páginas');
    }

    // 3. Fan count por cada página (usando su token)
    const detailedPages = await Promise.all(
        pagesList.data.map(async (page: FacebookPage) => {
            if (!page.access_token) return page;

            try {
                const detailRes = await fetch(
                    `${BASE_URL}/${VERSION}/${page.id}?fields=fan_count&access_token=${page.access_token}`
                );
                const detailData = await detailRes.json();

                return {
                    ...page,
                    fan_count: detailData?.fan_count ?? 0,
                };
            } catch (err) {
                console.error(`Error obteniendo fan_count para ${page.name}`, err);
                return page;
            }
        })
    );

    return {
        account: accountData,
        pages: detailedPages.map((page) => ({
            id: page.id,
            name: page.name,
            category: page.category,
            username: page.username,
            fan_count: page.fan_count,
            picture: page.picture,
            access_token: page.access_token, // dejar para debug si se desea
        })),
    };
}