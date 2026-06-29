import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Helper canônico do shadcn/ui para combinar classes Tailwind
 * resolvendo conflitos (ex.: `px-2` vence `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
