export type Direction = 'ltr' | 'rtl';
export type Orientation = 'horizontal' | 'vertical';

export function getDirectionalKey(key: string, direction: Direction): string {
  if (direction === 'rtl') {
    if (key === 'ArrowLeft') return 'ArrowRight';
    if (key === 'ArrowRight') return 'ArrowLeft';
  }
  return key;
}

export function getNextIndex(current: number, length: number, delta: number, loop = true): number {
  if (length <= 0) return -1;
  const next = current + delta;
  return loop ? ((next % length) + length) % length : Math.max(0, Math.min(length - 1, next));
}

export function isActivationKey(key: string): boolean { return key === 'Enter' || key === ' '; }
export function isComposing(event: KeyboardEvent): boolean { return event.isComposing || event.keyCode === 229; }
