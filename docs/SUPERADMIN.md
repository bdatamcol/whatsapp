# Panel de SuperAdmin

Este documento describe la configuración y uso del Panel de SuperAdmin, que permite gestionar múltiples empresas en la plataforma.

## Configuración Inicial

### 1. Configuración de Variables de Entorno

Agrega la siguiente variable a tu archivo `.env.local`:

```
SUPERADMIN_CREATION_SECRET=your_superadmin_secret
```

Puedes generar un valor seguro usando el script proporcionado:

```bash
node scripts/generate_superadmin_secret.js
```

### 2. Actualización de la Base de Datos

Ejecuta el script para modificar la tabla `profiles` y permitir el rol de superadmin:

```bash
node scripts/update_db_superadmin.js
```

Este script modifica la restricción CHECK en la tabla `profiles` para incluir el rol 'superadmin'.

### 3. Creación del Primer SuperAdmin

Utiliza el endpoint de registro de superadmin con una petición POST:

```
POST /api/superadmin/register-superadmin
```

Headers:
```
Content-Type: application/json
Authorization: Bearer your_superadmin_secret
```

Body:
```json
{
  "email": "superadmin@example.com",
  "password": "password_seguro"
}
```

## Acceso al Panel

Una vez configurado, puedes acceder al panel de superadmin en:

```
/superadmin
```

Inicia sesión con las credenciales del superadmin creado anteriormente.

## Funcionalidades

### Panel Principal

El panel principal muestra un resumen de las empresas registradas en la plataforma, incluyendo:

- Número total de empresas
- Acceso rápido a la gestión de empresas

### Gestión de Empresas

En la sección de gestión de empresas puedes:

1. **Ver todas las empresas registradas**
   - Nombre de la empresa
   - Fecha de creación
   - Administradores asociados

2. **Registrar nuevas empresas**
   - Nombre de la empresa
   - Email del administrador
   - Contraseña del administrador

3. **Eliminar empresas** (funcionalidad desactivada por defecto)
   - Esta funcionalidad está implementada a nivel de API pero desactivada en la interfaz por seguridad

## Seguridad

- El acceso al panel está restringido exclusivamente a usuarios con rol 'superadmin'
- La creación de superadmins está protegida por un token secreto
- Las operaciones sensibles como eliminar empresas están desactivadas por defecto

## Solución de Problemas

### Error al Crear Superadmin

Si encuentras errores al crear un superadmin, verifica:

1. Que la variable `SUPERADMIN_CREATION_SECRET` esté correctamente configurada
2. Que la base de datos haya sido actualizada para soportar el rol 'superadmin'
3. Que el email no esté ya registrado en el sistema

### Error al Acceder al Panel

Si no puedes acceder al panel de superadmin, verifica:

1. Que estés usando las credenciales correctas
2. Que el usuario tenga asignado el rol 'superadmin' en la tabla `profiles`
3. Que el middleware esté correctamente configurado para redirigir a los superadmins