// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Función de utilidad para pausar la ejecución de un bloque de código por un tiempo dado.
 * @param ms El número de milisegundos que se debe esperar.
 * @returns Una promesa que se resuelve después del tiempo especificado.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Obtiene el dominio base de la app para construir enlaces públicos consistentes. */
export function getAppBaseUrl(): string {
  const envBase = (import.meta as any)?.env?.VITE_PUBLIC_BASE_URL as string | undefined;
  if (envBase && typeof envBase === 'string' && envBase.trim()) return envBase.trim();
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}
