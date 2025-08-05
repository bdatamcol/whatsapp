# Implementación de Cifrado para Datos Sensibles

## Problema Resuelto

Se ha implementado una solución para cifrar información sensible de las empresas, específicamente:

1. El campo `prompt` que contiene instrucciones personalizadas para la IA
2. El token de acceso a WhatsApp (`whatsapp_access_token`)

Además, se ha corregido un problema de seguridad donde el cliente de Supabase con clave anónima podía actualizar el campo `prompt` directamente, lo cual no debería ser posible por razones de seguridad.

## Solución Implementada

### 1. Cifrado del Lado del Servidor

Se ha creado un nuevo endpoint API para manejar la actualización del campo `prompt` de forma segura:

- **Endpoint**: `/api/company/update-prompt`
- **Método**: POST
- **Autenticación**: Requerida
- **Cifrado**: AES-256-CBC

### 2. Descifrado Automático

Se han modificado los siguientes archivos para manejar el descifrado automático:

- `promptConfig.ts`: Descifra el prompt cuando se obtiene de la base de datos
- `getCompanyByPhoneNumberId.ts`: Descifra el token de WhatsApp cuando se obtiene

### 3. Políticas de Seguridad

Se ha creado un archivo SQL con políticas RLS (Row Level Security) para Supabase que restringe el acceso directo a campos sensibles desde el cliente:

- `supabase/policies.sql`: Contiene las políticas que deben aplicarse en la consola de Supabase

## Cómo Implementar

### Paso 1: Configurar Variables de Entorno

1. Copia el archivo `.env.local.example` a `.env.local`
2. Genera una clave de cifrado segura:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Establece la variable `ENCRYPTION_KEY` en tu archivo `.env.local`

### Paso 2: Aplicar Políticas RLS en Supabase

1. Accede a la consola de Supabase
2. Ve a la sección SQL Editor
3. Copia y pega el contenido de `supabase/policies.sql`
4. Ejecuta el script

### Paso 3: Migrar Datos Existentes

Para cifrar los datos existentes en la base de datos:

```bash
node scripts/encrypt-company-data.js
```

## Verificación

Para verificar que todo funciona correctamente:

1. Intenta actualizar el campo `prompt` desde la interfaz de administrador
2. Verifica en la base de datos que el valor almacenado está cifrado
3. Confirma que la aplicación puede descifrar y mostrar el valor correctamente

## Documentación Adicional

Para más detalles sobre la implementación de seguridad, consulta el archivo `docs/SECURITY.md`.

## Notas Importantes

- **NO elimines la clave `ENCRYPTION_KEY` una vez configurada**, ya que perderías acceso a los datos cifrados
- Asegúrate de hacer una copia de seguridad de tu clave de cifrado en un lugar seguro
- Esta implementación utiliza cifrado simétrico (la misma clave para cifrar y descifrar)