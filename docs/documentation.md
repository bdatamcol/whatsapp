# Proyecto Asistente de WhatsApp - Flujo funcional

## 1. Flujo de autenticación
- **Inicio de sesión**: los usuarios se autentican a través de Supabase
- **Acceso basado en roles**:
  - Administrador: acceso completo a todas las funciones
  - Asistente: limitado a los contactos asignados
- **Gestión de sesiones**: tokens JWT para un acceso seguro

## 2. Panel de administración
- **Gestión de contactos**:
  - Ver todos los contactos
  - Asignar contactos a los asistentes
  - Supervisar el historial de interacciones
- **Análisis**:
  - Métricas de rendimiento
  - Seguimiento del tiempo de respuesta

## 3. Interfaz del asistente
- **Interfaz de chat**:
  - Mensajería en tiempo real con los contactos
  - Seguimiento del historial de mensajes
  - Plantillas de respuesta rápida
- **Gestión de contactos**:
  - Ver contactos asignados
  - Actualizar el estado de los contactos
  - Marcar conversaciones como resueltas

## 4. Integración con WhatsApp
- **Procesamiento de mensajes**:
  - Gestión de mensajes entrantes
  - Respuestas automáticas
  - Sistema de cola de mensajes
- **Comunicación API**:
  - Integración con la API de WhatsApp Business
  - Configuración de webhooks

## 5. Operaciones de la base de datos
- **Servicios Supabase**:
  - Tabla de contactos
  - Tabla de asignaciones
  - Historial de mensajes
  - Perfiles de usuario

## 6. Informes
- **Informes diarios**:
  - Mensajes enviados/recibidos
  - Tasas de resolución
  - Rendimiento de los asistentes

## 7. Ajustes y configuración
- **Preferencias del usuario**:
  - Ajustes de notificaciones
  - Opciones de visualización
- **Configuración del sistema**:
  - Gestión de claves API
  - URL de webhooks