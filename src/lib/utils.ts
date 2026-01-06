/* General utility functions (exposes cn, formatDate, THEME_COLORS) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  date: string | number | Date | null | undefined,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  },
) {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Invalid Date'
  return d.toLocaleDateString(locale, options)
}

export const THEME_COLORS = {
  blue: {
    primary: '243 75% 59%',
    foreground: '210 40% 98%',
    label: 'Blue',
    color: '#4F46E5',
  },
  green: {
    primary: '142 71% 45%',
    foreground: '210 40% 98%',
    label: 'Green',
    color: '#16a34a',
  },
  violet: {
    primary: '262 83% 58%',
    foreground: '210 40% 98%',
    label: 'Violet',
    color: '#8b5cf6',
  },
  rose: {
    primary: '346 84% 61%',
    foreground: '210 40% 98%',
    label: 'Rose',
    color: '#e11d48',
  },
  orange: {
    primary: '24 95% 53%',
    foreground: '210 40% 98%',
    label: 'Orange',
    color: '#f97316',
  },
} as const

export type ThemeColor = keyof typeof THEME_COLORS
