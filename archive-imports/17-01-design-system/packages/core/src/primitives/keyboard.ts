import type { Direction } from './roving-tabindex.js';

export type NavigationKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown';

export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

export function hasModifierKey(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.altKey || event.metaKey;
}

/**
 * Resolve a direção lógica de teclas horizontais considerando LTR e RTL.
 */
export function getLogicalHorizontalStep(key: string, dir: Direction = 'ltr'): 1 | -1 | 0 {
  if (key === 'ArrowRight') return dir === 'rtl' ? -1 : 1;
  if (key === 'ArrowLeft') return dir === 'rtl' ? 1 : -1;
  return 0;
}
