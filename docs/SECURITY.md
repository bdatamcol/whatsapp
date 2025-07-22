# Guía de Seguridad para Datos Sensibles

Este documento describe cómo se manejan los datos sensibles en la aplicación, específicamente el cifrado de información confidencial de las empresas.

## Cifrado de Datos

La aplicación implementa cifrado del lado del servidor para proteger información sensible como:

- Prompts personalizados de IA
- Tokens de acceso a WhatsApp
- Otras credenciales de API

### Tecnología de Cifrado

- Algoritmo: AES-256-CBC
- Implementación: Node.js crypto (estándar de la industria)
- Vector de inicialización (IV): Generado aleatoriamente para cada cifrado
- Formato de datos cifrados: `iv:encrypted_data` (ambos en formato hexadecimal)

## Configuración

### 1. Configurar la Clave de Cifrado

1. Copia el archivo `.env.local.example` a `.env.local`
2. Genera una clave de cifrado segura:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Establece la variable `ENCRYPTION_KEY` en tu archivo `.env.local` con la clave generada

### 2. Migrar Datos Existentes

Para cifrar datos existentes en la base de datos, ejecuta el script de migración:

```bash
npm install dotenv # Si aún no está instalado
node scripts/encrypt-company-data.js
```

## Arquitectura de Seguridad

### Flujo de Datos

1. **Cliente a Servidor**: Los datos sensibles se envían a través de HTTPS al servidor
2. **Cifrado**: El servidor cifra los datos usando la clave secreta antes de almacenarlos en Supabase
3. **Almacenamiento**: Solo se almacenan versiones cifradas en la base de datos
4. **Descifrado**: Solo el servidor puede descifrar los datos cuando sea necesario

### Mejores Prácticas Implementadas

1. **Separación de Clientes**:
   - Cliente del navegador: Usa la clave anónima (solo lectura)
   - Servidor: Usa la clave de servicio (lectura/escritura)

2. **API Segura**:
   - Endpoints dedicados para operaciones sensibles
   - Autenticación requerida para todas las operaciones
   - Validación de pertenencia a la empresa

3. **Políticas de Seguridad**:
   - Implementar políticas RLS (Row Level Security) en Supabase
   - Restringir acceso directo a datos sensibles desde el cliente

## Solución de Problemas

### Error al Descifrar

Si encuentras errores al descifrar datos, verifica:

1. La clave `ENCRYPTION_KEY` es la misma que se usó para cifrar
2. El formato de los datos cifrados es correcto (`iv:encrypted_data`)
3. Los datos no fueron modificados después del cifrado

### Rotación de Claves

Para cambiar la clave de cifrado:

1. Crea una nueva clave
2. Descifra todos los datos con la clave antigua
3. Cifra los datos con la nueva clave
4. Actualiza la variable `ENCRYPTION_KEY` en `.env.local`

## Notas Adicionales

- Nunca almacenes la clave de cifrado en el código fuente o en repositorios públicos
- Considera usar un servicio de gestión de secretos para entornos de producción
- Realiza copias de seguridad regulares de tus datos y claves de cifrado