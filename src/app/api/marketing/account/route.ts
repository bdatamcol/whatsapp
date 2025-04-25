// app/api/marketing/account/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'
export async function GET() {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const accountId = process.env.MARKETING_ACCOUNT_ID;
  const version = process.env.META_API_VERSION || 'v17.0';

  if (!accessToken || !accountId) {
    return NextResponse.json({ ok: false, error: 'Faltan credenciales' }, { status: 400 });
  }

  try {
    // Obtener datos del Ad Account
    const accountRes = await fetch(
      `https://graph.facebook.com/${version}/${accountId}?fields=name,account_status&access_token=${accessToken}`
    );
    const accountData = await accountRes.json();

    // Obtener lista de páginas asociadas
    // Modificar el fetch de páginas para incluir force_token
const pagesRes = await fetch(
  `https://graph.facebook.com/${version}/me/accounts?fields=id,name,category,username,access_token&access_token=${accessToken}&force_token=page`
);
    const pagesList = await pagesRes.json();

    if (!pagesList?.data) {
      return NextResponse.json({ ok: false, error: 'No se encontraron páginas' }, { status: 404 });
    }

    // Para cada página, obtener detalles con su Page Access Token
    const detailedPages = await Promise.all(
      pagesList.data.map(async (page: FacebookPage) => {

              if (!page.access_token) return page;

        try {
          const detailRes = await fetch(
            `https://graph.facebook.com/${version}/${page.id}?fields=fan_count&access_token=${page.access_token}`
          );
          const detailData = await detailRes.json();

          // Agregar en el return de detailedPages
return {
  ...page,
  fan_count: detailData?.fan_count ?? 0,
  access_token: page.access_token.substring(0, 15) + '...' // Solo para debug
};
          
        } catch (err) {
          console.error(`Error obteniendo fan_count para ${page.name}`, err);
          return page;
        }
      })
    );

    // app/api/marketing/account/route.ts
// ... (código existente)

return NextResponse.json({
  ok: true,
  account: accountData,
  pages: detailedPages.map(page => ({
    id: page.id,
    name: page.name,
    category: page.category,
    username: page.username,
    fan_count: page.fan_count,
    access_token: page.access_token // Asegurarnos que se incluye
  }))
});

type FacebookPage = {
  id: string;
  name: string;
  category?: string;
  username?: string;
  access_token?: string;
  fan_count?: number;
};

  } catch (error) {
    console.error('Error al obtener datos del marketing account:', error);
    return NextResponse.json({ ok: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
