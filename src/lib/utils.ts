import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitas penggabung nama kelas Tailwind dengan resolusi konflik class
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
