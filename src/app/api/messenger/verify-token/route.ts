import { NextRequest, NextResponse } from "next/server";
import { MessengerAccountsService } from "@/lib/messenger/accounts";

// GET /api/messenger/verify-token?pageId=123456789
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ 
        error: 'pageId es requerido' 
      }, { status: 400 });
    }

    const accessToken = MessengerAccountsService.getPageAccessToken(pageId);
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        canSendMessages: false,
        missingPermissions: [],
        recommendations: [
          'No se encontró un token de acceso para esta página',
          'Por favor, configura el token en las variables de entorno',
          'Consulta FACEBOOK_TOKEN_SETUP.md para más información'
        ],
        error: 'Token no encontrado'
      });
    }

    // Verificar el token con Facebook Graph API
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=name,access_token&access_token=${accessToken}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error verificando token:', errorData);
      
      return NextResponse.json({
        success: false,
        canSendMessages: false,
        missingPermissions: [],
        recommendations: [
          'El token proporcionado no es válido',
          'Verifica que el token tenga los permisos necesarios',
          'Asegúrate de que el token pertenezca a la página correcta'
        ],
        error: errorData.error?.message || 'Token inválido'
      });
    }

    // Verificar permisos específicos
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`);
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
        'Consulta FACEBOOK_TOKEN_SETUP.md para instrucciones detalladas'
      ];
    }

    return NextResponse.json({
      success: true,
      canSendMessages,
      missingPermissions,
      recommendations,
      pageInfo: {
        name: (await response.json()).name,
        pageId
      }
    });

  } catch (error) {
    console.error('Error en verify-token:', error);
    return NextResponse.json({
      success: false,
      canSendMessages: false,
      missingPermissions: [],
      recommendations: [
        'Error al verificar el token',
        'Por favor, revisa la configuración del servidor',
        'Verifica que el token esté correctamente configurado'
      ],
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}