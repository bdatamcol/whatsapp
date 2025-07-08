# WhatsApp Bot-Clean - Next.js Agent Chat

Una aplicación de chat estilo WhatsApp construida con Next.js, Socket.IO y SUPABASE. También incluye integración con Meta, Facebook y OpenAI.

## Requisitos Previos

- Node.js (versión 18 o superior)
- SUPABASE instalado y ejecutándose localmente, o una URI de SUPABASE válida
- Meta Developer Account (para integración con Meta)
- Facebook Developer Account (para integración con Facebook)
- OpenAI API Key (para integración con OpenAI)
- WhatsApp Business Account (para pruebas)
- Variables de entorno configuradas (ver sección de configuración)

## Características

- Integración con Meta, Facebook y OpenAI
- Soporte para múltiples chats en tiempo real
- Soporte para múltiples proveedores de IA (OpenAI y OpenRouter)

## Configuración

1. Clona el repositorio
2. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
## Secrets for Meta
META_API_VERSION=v23.0 # Format: v{major}.{minor}
META_APP_ID=your_meta_app_id # Format: numerical ID
META_APP_SECRET=your_meta_app_secret # Format: alphanumeric string

## Secrets for Facebook
FACEBOOK_ACCESS_TOKEN=your_fb_access_token # Format: EAA... (long string)
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id # Format: numerical ID
MARKETING_ACCOUNT_ID=your_marketing_id # Format: act_{numerical_id}
FB_CATALOG_ID=your_catalog_id # Format: numerical ID

## Secrets for Whatsapp
WHATSAPP_API_TOKEN=your_whatsapp_token # Format: EAA... (long string)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id # Format: numerical ID

## Secrets for webhooks de whatsapp, generado con ruby
VERYFY_WEBHOOK_SECRET=your_webhook_secret # Format: hexadecimal string (40 characters)

## Proveedor de IA
AI_PROVIDER=your_ai_provider # Example: openrouter, openai

## System prompt
SYSTEM_PROMPT=your_system_prompt # Define your AI assistant's behavior

## OpenAI
OPENAI_API_KEY=your_openai_key # Format: sk-... 
OPENAI_BASE_URL=your_openai_url # Format: https://api.openai.com/v1/chat/completions
OPENAI_MODEL=your_model_name # Example: gpt-3.5-turbo

## OpenRouter
OPENROUTER_API_KEY=your_openrouter_key # Format: sk-or-v1-...
OPENROUTER_BASE_URL=your_openrouter_url # Format: https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=your_model_name # Format: provider/model-name

## Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key # Format: JWT token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url # Format: https://{project}.supabase.co
SUPABASE_ROLE_KEY=your_role_key # Format: JWT token

## SEED SECRET
SEED_SECRET=your_seed_secret # Format: alphanumeric string
```

# Instalación
1. ```npm i```
2. ```npm run dev```
3. La aplicación estará disponible en http://localhost:3000

### Estructura del Proyecto
- ```src/app/api``` - Rutas de la API y Webhooks
- ```src/app/components``` - Componentes React
- ```src/app/providers``` - Proveedores de contexto
- ```src/lib``` - Funciones y utilidades
- ```src/types``` - Tipos de TypeScript


## Generacion de token para verificacion contra webhooks

Comando con Ruby instalado
```
ruby -rsecurerandom -e 'puts SecureRandom.hex(20)'
```

Ejemplo: __No usar en producción__

```4510c8cf2fe423f8be5afccbdd30c678677e172b```

### Llenar de la base de datos
Usamos la seed de Supabase, que se encuenta en el endpoint:
```
URL_ADDRESS:3000/api/dev/seed   
```
Tenemos que pasar el token de seed en el header de la peticion:
```
SEED_SECRET: your_seed_secret
```