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
