import type { Direction } from './keyboard';
export interface LocaleConfig { locale: string; direction?: Direction; messages?: Record<string, string> }
export const defaultMessages: Record<string, string> = { close: 'Close', open: 'Open', dismiss: 'Dismiss', previous: 'Previous', next: 'Next', loading: 'Loading' };
export function resolveDirection(locale: string, explicit?: Direction): Direction {
  if (explicit) return explicit;
  const language = locale.toLowerCase().split('-')[0];
  return ['ar', 'fa', 'he', 'ur', 'ps', 'sd', 'ug', 'yi'].includes(language ?? '') ? 'rtl' : 'ltr';
}
export function createI18n(config: LocaleConfig) {
  const messages = { ...defaultMessages, ...config.messages };
  return { locale: config.locale, direction: resolveDirection(config.locale, config.direction), t: (key: string, fallback?: string) => messages[key] ?? fallback ?? key };
}
