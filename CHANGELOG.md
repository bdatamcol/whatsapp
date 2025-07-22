# 📦 CHANGELOG

Todos los cambios notables en este proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y [SemVer](https://semver.org/lang/es/).

---

## [No publicado]

### ✨ Agregado
- **Implementación de panel para super administador**: Panel de administración para super administradores que permite gestionar cuentas, contactos y asignaciones.

### ⚙️ Mejorado
- **Refactorización de TanStack Query**: Se centralizó la configuración de React Query para usar un `QueryClientProvider` global, eliminando instancias locales en los componentes `Panel` y `AdsManager`. Esto asegura un comportamiento de caché consistente en toda la aplicación.
- **Consistencia de nombrado**: Se renombró el archivo `AdsManage.tsx` a `AdsManager.tsx` para que coincida con el nombre del componente exportado.

### 🐞 Corregido
- **Error de renderizado en `AdsManager`**: Se solucionó un error que ocurría cuando el componente intentaba renderizar un objeto en lugar de un valor primitivo, causando un fallo en la UI del dashboard de marketing.

### 🚨 Advertencias conocidas
- `crypto.randomUUID()` no es compatible con algunos navegadores antiguos. Se recomienda usar navegadores modernos como Chrome, Edge o Firefox actualizados.
- Hay advertencias relacionadas con SSR/hidratación en el chat, pero no bloquean el flujo funcional.
- Algunas funcionalidades no están protegidas contra errores de red o recargas forzadas.
- Inicialmento toda la informacion relacionada con meta está estatica y solo depende de una cuenta, no esta enlazada a un contacto especifico.
- En el panel de administración, se muestra unicamente la informacion de la cuenta, no la de los contactos.


## [0.2.0] - 2025-07-12

### ✨ Agregado
- **Sistema de autenticación con Supabase** (inicio de sesión, sesiones por JWT).
- **Gestión por roles** (`admin` y `assistant`).
- **Vista del asistente**:
  - Chat funcional con usuarios asignados
  - Botón para devolver el contacto a la IA
  - Vista de historial de contactos atendidos agrupados por teléfono
- Panel de administración:
  - Asignación de contactos por `select`
  - Escucha en tiempo real de cambios en asignaciones y necesidades humanas
- Scroll automático en los chats y feedback visual con `toasts`.

### ⚙️ Mejorado
- Uso de tablas anidadas y `badges` para visualización clara del historial.
- Separación lógica de componentes (`ChatView`, `HistoryPage`, etc.).
- Organización del documento funcional en `/docs/funcional.md`.

### 🐞 Corregido
- Eliminación de duplicados en el historial por medio de agrupación por `contact_phone`.
- Corrección en canales de Supabase Realtime para evitar actualizaciones incorrectas.
- Manejo de errores si `crypto.randomUUID` no está disponible.

### 🚨 Advertencias conocidas
- `crypto.randomUUID()` no es compatible con algunos navegadores antiguos. Se recomienda usar navegadores modernos como Chrome, Edge o Firefox actualizados.
- Hay advertencias relacionadas con SSR/hidratación en el chat, pero no bloquean el flujo funcional.
- Algunas funcionalidades no están protegidas contra errores de red o recargas forzadas.

---

## [0.1.0] - 2025-07-10

### 🧪 Prototipo inicial

- Chat básico con mensajes simulados
- Almacenamiento de mensajes en Supabase (`conversations`)
- Tablas básicas: `contacts`, `assistants_assignments`, `profiles`
- Backend funcional con rutas API en Next.js
- Integración inicial con Supabase Realtime

---