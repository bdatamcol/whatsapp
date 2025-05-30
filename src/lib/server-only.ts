// src/lib/server-only.ts
export function ensureServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Este módulo solo puede usarse en el servidor. ' +
      'Revise las importaciones para asegurarse que no se está ' +
      'incluyendo en el bundle del cliente.'
    );
  }
}

// Función para verificar en tiempo de ejecución
export function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Esta función solo puede ejecutarse en el servidor. ' +
      'Mueva la lógica a una ruta API o Server Action.'
    );
  }
}