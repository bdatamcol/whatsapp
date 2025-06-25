import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// En cualquier archivo que use MongoDB directamente
/* if (typeof window !== 'undefined') {
  throw new Error('Este módulo solo puede usarse en el servidor');
} */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Añade estas nuevas utilidades para manejo del entorno
export const isServer = typeof window === "undefined";
export const isClient = !isServer;

// Función segura para conexión a MongoDB
// export async function safeMongoConnect() {
//   if (!isServer) {
//     throw new Error("MongoDB operations are only allowed on server side");
//   }
//   const { MongoClient } = await import("mongodb");
//   return MongoClient.connect(process.env.MONGODB_URI!);
// }