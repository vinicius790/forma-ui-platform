import { getOwnerDocument, isHTMLElement } from './dom.js';

const TABBABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

function isElementHidden(element: HTMLElement): boolean {
  if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
    return true;
  }
  if (element.closest('[hidden], [inert]')) {
    return true;
  }
  const win = element.ownerDocument.defaultView;
  if (win && typeof win.getComputedStyle === 'function') {
    const style = win.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }
  }
  return false;
}

export function getTabbableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR));
  return candidates.filter((el) => {
    if (el.tabIndex < 0) return false;
    if ((el as HTMLButtonElement).disabled) return false;
    return !isElementHidden(el);
  });
}

export function focusElement(element: HTMLElement | null | undefined): boolean {
  if (!element || typeof element.focus !== 'function') return false;
  element.focus({ preventScroll: true });
  return element.ownerDocument.activeElement === element;
}

export interface FocusTrapOptions {
  container: HTMLElement;
  initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
  restoreFocus?: boolean;
  loop?: boolean;
}

export interface FocusTrapController {
  activate: () => void;
  deactivate: () => void;
  isActive: () => boolean;
}

const activeTrapStack: FocusTrapController[] = [];

export function createFocusTrap(options: FocusTrapOptions): FocusTrapController {
  const { container, initialFocus, restoreFocus = true, loop = true } = options;
  let active = false;
  let previouslyFocused: HTMLElement | null = null;

  const isTopmost = () => activeTrapStack[activeTrapStack.length - 1] === controller;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!active || !isTopmost() || event.key !== 'Tab') return;

    const tabbables = getTabbableElements(container);
    if (tabbables.length === 0) {
      event.preventDefault();
      focusElement(container);
      return;
    }

    const first = tabbables[0]!;
    const last = tabbables[tabbables.length - 1]!;
    const doc = getOwnerDocument(container);
    const current = doc.activeElement as HTMLElement | null;

    if (!current || !container.contains(current)) {
      event.preventDefault();
      focusElement(event.shiftKey ? last : first);
      return;
    }

    if (event.shiftKey) {
      if (current === first) {
        event.preventDefault();
        if (loop) focusElement(last);
      }
    } else if (current === last) {
      event.preventDefault();
      if (loop) focusElement(first);
    }
  };

  const handleFocusIn = (event: FocusEvent) => {
    if (!active || !isTopmost()) return;
    const target = event.target;
    if (isHTMLElement(target) && !container.contains(target)) {
      const tabbables = getTabbableElements(container);
      focusElement(tabbables[0] ?? container);
    }
  };

  const controller: FocusTrapController = {
    activate() {
      if (active) return;
      active = true;
      const doc = getOwnerDocument(container);
      previouslyFocused = isHTMLElement(doc.activeElement) ? doc.activeElement : null;
      activeTrapStack.push(controller);

      doc.addEventListener('keydown', handleKeyDown, true);
      doc.addEventListener('focusin', handleFocusIn, true);

      const resolvedInitial =
        typeof initialFocus === 'function' ? initialFocus() : initialFocus;
      if (resolvedInitial) {
        focusElement(resolvedInitial);
      } else {
        const tabbables = getTabbableElements(container);
        if (tabbables[0]) {
          focusElement(tabbables[0]);
        } else {
          if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '-1');
          }
          focusElement(container);
        }
      }
    },
    deactivate() {
      if (!active) return;
      active = false;
      const doc = getOwnerDocument(container);
      doc.removeEventListener('keydown', handleKeyDown, true);
      doc.removeEventListener('focusin', handleFocusIn, true);

      const idx = activeTrapStack.indexOf(controller);
      if (idx !== -1) {
        activeTrapStack.splice(idx, 1);
      }

      if (restoreFocus && previouslyFocused && previouslyFocused.isConnected) {
        focusElement(previouslyFocused);
      }
      previouslyFocused = null;
    },
    isActive() {
      return active;
    }
  };

  return controller;
}
