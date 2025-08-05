# Arquitectura de Marketing por Empresa

## Descripción General

Este documento describe la nueva arquitectura implementada para separar las funcionalidades de marketing de Facebook/Meta por empresa, siguiendo el mismo patrón utilizado para WhatsApp.

## Cambios Implementados

### 1. Nuevos Servicios por Empresa

#### `company-ads.ts`
- **Ubicación**: `src/lib/marketing/services/company-ads.ts`
- **Función**: Maneja las campañas de Facebook específicas por empresa
- **Características**:
  - Obtiene configuración de Facebook desde la base de datos por `company_id`
  - Descifra automáticamente campos sensibles
  - Funciones: `getCompanyFacebookConfig()`, `getCompanyFacebookCampaigns()`

#### `company-insights.ts`
- **Ubicación**: `src/lib/marketing/services/company-insights.ts`
- **Función**: Maneja insights y métricas de Facebook por empresa
- **Características**:
  - Conversión automática de monedas a USD
  - Filtrado por fechas y límites
  - Función: `getCompanyFacebookInsights()`

#### `company-account.ts`
- **Ubicación**: `src/lib/marketing/services/company-account.ts`
- **Función**: Maneja información de cuentas y páginas de Facebook por empresa
- **Características**:
  - Obtiene información de la cuenta de Facebook
  - Lista páginas asociadas a la empresa
  - Funciones: `getCompanyFacebookAccount()`, `getCompanyFacebookPages()`

### 2. Nuevas Rutas API

#### `/api/marketing/company/ads`
- **Método**: GET
- **Autenticación**: Requerida
- **Función**: Obtiene campañas de Facebook de la empresa del usuario autenticado
- **Parámetros**:
  - `limit`: Número de campañas a obtener
  - `after`: Cursor para paginación
  - `getSummary`: Obtener solo el total de campañas
  - `filterStatus`: Filtrar por estado de campaña

#### `/api/marketing/company/insights`
- **Método**: GET
- **Autenticación**: Requerida
- **Función**: Obtiene insights de Facebook de la empresa del usuario autenticado
- **Parámetros**:
  - `limit`: Número de insights a obtener
  - `after`: Cursor para paginación
  - `getTotalSpend`: Obtener solo el gasto total

#### `/api/marketing/company/account`
- **Método**: GET
- **Autenticación**: Requerida
- **Función**: Obtiene información de cuenta/páginas de Facebook de la empresa
- **Parámetros**:
  - `type`: 'account' o 'pages'

### 3. Cambios en Base de Datos

#### Nuevos Campos en `companies`
```sql
ALTER TABLE public.companies 
ADD COLUMN facebook_access_token TEXT,
ADD COLUMN facebook_ad_account_id TEXT,
ADD COLUMN marketing_account_id TEXT,
ADD COLUMN facebook_catalog_id TEXT;
```

**Campos agregados**:
- `facebook_access_token`: Token de acceso de Facebook (cifrado)
- `facebook_ad_account_id`: ID de cuenta de anuncios
- `marketing_account_id`: ID de cuenta de marketing
- `facebook_catalog_id`: ID de catálogo de productos

### 4. Componentes Actualizados

#### `AdsManager.tsx`
- Actualizado para usar `/api/marketing/company/ads`
- Ahora obtiene datos específicos de la empresa del usuario

#### `MetricsDashboard.tsx`
- Actualizado para usar `/api/marketing/company/insights`
- Métricas filtradas por empresa automáticamente

#### `Panel.tsx`
- Todas las consultas de marketing actualizadas a rutas por empresa
- Datos de campañas, insights y gastos específicos por empresa

#### `CompanyProfileEditor.tsx`
- Agregados campos para configuración de Facebook/Meta
- Soporte para descifrado de tokens y IDs sensibles
- Interfaz para visualizar configuración de marketing

## Seguridad

### Cifrado de Datos Sensibles
- Todos los tokens y IDs sensibles se almacenan cifrados en la base de datos
- Descifrado automático en el servidor usando `ENCRYPTION_KEY`
- Los componentes del cliente solo muestran versiones truncadas de datos sensibles

### Autenticación y Autorización
- Todas las rutas API verifican autenticación del usuario
- Los datos se filtran automáticamente por `company_id` del usuario
- No es posible acceder a datos de otras empresas

## Migración desde Sistema Global

### Variables de Entorno Deprecadas
Las siguientes variables de `.env.local` ahora se almacenan por empresa:
- `FACEBOOK_ACCESS_TOKEN` → `companies.facebook_access_token`
- `FACEBOOK_AD_ACCOUNT_ID` → `companies.facebook_ad_account_id`
- `MARKETING_ACCOUNT_ID` → `companies.marketing_account_id`
- `FACEBOOK_CATALOG_ID` → `companies.facebook_catalog_id`

### Variables de Entorno Mantenidas
- `META_API_VERSION`: Versión de API de Meta (global)
- `META_APP_ID`: ID de aplicación Meta (global)
- `META_APP_SECRET`: Secreto de aplicación Meta (global)
- `ENCRYPTION_KEY`: Clave para cifrado de datos sensibles

## Flujo de Datos

1. **Usuario se autentica** → Obtiene `company_id` desde `profiles`
2. **Componente hace petición** → API verifica autenticación y `company_id`
3. **Servicio obtiene configuración** → `getCompanyFacebookConfig(company_id)`
4. **Descifrado automático** → Campos sensibles se descifran en el servidor
5. **Llamada a Facebook API** → Usando configuración específica de la empresa
6. **Respuesta filtrada** → Solo datos de la empresa del usuario

## Beneficios

1. **Aislamiento de Datos**: Cada empresa solo ve sus propios datos de marketing
2. **Escalabilidad**: Soporte para múltiples empresas con diferentes configuraciones
3. **Seguridad**: Datos sensibles cifrados y acceso controlado
4. **Consistencia**: Mismo patrón usado para WhatsApp y marketing
5. **Mantenibilidad**: Código organizado y servicios reutilizables

## Próximos Pasos

1. **Migración de Datos**: Mover configuraciones existentes de `.env.local` a la base de datos
2. **Interfaz de Configuración**: Permitir a superadmins configurar Facebook por empresa
3. **Validación**: Implementar validación de tokens y configuraciones
4. **Monitoreo**: Agregar logs y métricas para el uso de APIs por empresa
5. **Documentación de Usuario**: Crear guías para configurar Facebook por empresa