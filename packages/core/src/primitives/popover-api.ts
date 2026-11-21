/**
 * Progressive enhancement wrapper for the native HTML Popover API (top-layer).
 * SSR-safe; falls back gracefully when `showPopover`/`hidePopover` are unavailable.
 */

export type NativePopoverMode = 'auto' | 'manual';

export function supportsNativePopoverApi(): boolean {
  return (
    typeof HTMLElement !== 'undefined' &&
    typeof (HTMLElement.prototype as HTMLElement & { showPopover?: unknown }).showPopover === 'function'
  );
}

export function showNativePopover(element: HTMLElement | null, mode: NativePopoverMode = 'auto'): boolean {
  if (!element) return false;
  const el = element as HTMLElement & { popover?: string; showPopover?: () => void };
  if (typeof el.showPopover !== 'function') return false;
  try {
    if (!el.getAttribute('popover')) el.setAttribute('popover', mode);
    el.showPopover();
    return true;
  } catch {
    return false;
  }
}

export function hideNativePopover(element: HTMLElement | null): boolean {
  if (!element) return false;
  const el = element as HTMLElement & { hidePopover?: () => void };
  if (typeof el.hidePopover !== 'function') return false;
  try {
    el.hidePopover();
    return true;
  } catch {
    return false;
  }
}
