# WhatsApp Bot

# WhatsApp Clean

Una aplicación de chat estilo WhatsApp construida con Next.js, Socket.IO y SUPABASE. También incluye integración con Meta, Facebook y OpenAI.

## Requisitos Previos

- Node.js (versión 18 o superior)
- SUPABASE instalado y ejecutándose localmente, o una URI de SUPABASE Atlas
- Variables de entorno configuradas (ver sección de configuración)

## Configuración

1. Clona el repositorio
2. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
WHATSAPP_TOKEN=
SUPABASE_DB=
SUPABASE_URI=
META_API_VERSION=
META_APP_ID=
META_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_AD_ACCOUNT_ID=
MARKETING_ACCOUNT_ID=
FB_CATALOG_ID=
OPENAI_API_KEY=
```

# Instalación
1. ´npm i´
2. ´npm run dev´
3. La aplicación estará disponible en http://localhost:3000

### Estructura del Proyecto
- ´src/app/api´ - Rutas de la API y Webhooks
- ´src/app/components´ - Componentes React
- ´src/app/providers´ - Proveedores de contexto
- ´src/lib´ - Funciones y utilidades
- ´src/types´ - Tipos de TypeScript


## Generacion de token para verificacion contra webhooks

Comando con Ruby instalado
```
ruby -rsecurerandom -e 'puts SecureRandom.hex(20)'
```

Ejemplo: __No usar en producción__

4510c8cf2fe423f8be5afccbdd30c678677e172b