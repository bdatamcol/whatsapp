import { NextRequest, NextResponse } from "next/server";
import { MessengerAccountsService } from "@/lib/messenger/accounts";

// GET /api/messenger/pages - Obtener información de páginas configuradas
export async function GET(request: NextRequest) {
  try {
    const pages = [];
    
    // Buscar tokens de Facebook configurados
    const pageTokens = [];
    
    // Buscar tokens específicos por página
    const pageSpecificTokens = Object.keys(process.env)
      .filter(key => key.startsWith('FACEBOOK_PAGE_TOKEN_'))
      .map(key => {
        const pageId = key.replace('FACEBOOK_PAGE_TOKEN_', '');
        const token = process.env[key];
        return { pageId, token };
      })
      .filter(page => page.token && page.token !== 'TU_TOKEN_AQUI');
    
    pageTokens.push(...pageSpecificTokens);
    
    // Si hay un token general de página, intentar obtener páginas asociadas
    const generalPageToken = process.env.FACEBOOK_PAGE_TOKEN;
    const generalAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (generalPageToken && generalPageToken !== 'TU_TOKEN_AQUI') {
      // Intentar obtener información de la página usando el token general
      try {
        const pageInfoResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?access_token=${generalPageToken}`
        );
        
        if (pageInfoResponse.ok) {
          const pageInfo = await pageInfoResponse.json();
          if (pageInfo.id) {
            pageTokens.push({ pageId: pageInfo.id, token: generalPageToken });
          }
        }
      } catch (error) {
        console.warn('No se pudo obtener info con token general:', error);
      }
    }

    // Para cada página, obtener información básica y estadísticas
    for (const { pageId, token } of pageTokens) {
      try {
        // Intentar obtener información de la página desde Facebook
        let pageName = `Página ${pageId.slice(-4)}`; // Nombre por defecto
        
        try {
          const pageInfoResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=name,category&access_token=${token}`
          );
          
          if (pageInfoResponse.ok) {
            const pageInfo = await pageInfoResponse.json();
            if (pageInfo.name) {
              pageName = pageInfo.name;
            }
          }
        } catch (error) {
          console.warn(`No se pudo obtener info de página ${pageId}:`, error);
        }

        // Obtener estadísticas de mensajes locales
        const stats = MessengerAccountsService.getPageStats(pageId);

        pages.push({
          pageId,
          pageName,
          hasToken: true,
          stats
        });
      } catch (error) {
        console.error(`Error procesando página ${pageId}:`, error);
      }
    }

    // Si no hay páginas configuradas, agregar páginas de ejemplo
    if (pages.length === 0) {
      const examplePages = ['102342781636477', '987654321098765'];
      
      for (const pageId of examplePages) {
        const stats = MessengerAccountsService.getPageStats(pageId);
        pages.push({
          pageId,
          pageName: `Página ${pageId.slice(-4)}`,
          hasToken: false,
          stats
        });
      }
    }

    return NextResponse.json({ 
      pages,
      total: pages.length
    });

  } catch (error) {
    console.error('Error obteniendo páginas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}