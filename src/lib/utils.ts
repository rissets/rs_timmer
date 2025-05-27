
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentDateString(): string {
  const today = new Date();
  // Uses date-fns format to ensure consistency if needed elsewhere,
  // but a simple padStart would also work for YYYY-MM-DD.
  return format(today, 'yyyy-MM-dd');
}

export function formatDateToKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
