// clsx: utilitário para combinar classes CSS condicionalmente
// ClassValue: tipo TypeScript que aceita strings, arrays, objetos de classes
import { clsx, type ClassValue } from "clsx"

// twMerge: resolve conflitos entre classes do Tailwind CSS
// (ex: se você passar "p-4" e "p-2", ele mantém só "p-2" — o último vence)
import { twMerge } from "tailwind-merge"

/**
 * Função utilitária para combinar classes CSS de forma segura com Tailwind.
 * Aceita qualquer combinação de strings, arrays e objetos condicionais.
 *
 * Exemplo de uso:
 *   cn("p-4 text-sm", isActive && "bg-blue-500", { "font-bold": isBold })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)) // 1. clsx une as classes; 2. twMerge resolve conflitos Tailwind
}
