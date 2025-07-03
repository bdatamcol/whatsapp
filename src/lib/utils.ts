import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Añade estas nuevas utilidades para manejo del entorno
export const isServer = typeof window === "undefined";
export const isClient = !isServer;