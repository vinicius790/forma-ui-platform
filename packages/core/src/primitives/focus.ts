import {
  composedContains,
  getComposedParent,
  getDeepActiveElement,
  isElement,
  isShadowRoot,
  ownerDocument,
} from './dom';

const TABBABLE = [
  'a[href]',
  'area[href]',
  'summary',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'audio[controls]',
  'video[controls]',
  'iframe',
  'object',
  'embed',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const trapsByDocument = new WeakMap<Document, FocusTrap[]>();

function isHiddenByTree(element: HTMLElement): boolean {
  let current: Node | null = element;
  let depth = 0;
  while (current && depth < 1024) {
    if (isElement(current)) {
      const htmlEl = current as HTMLElement;
      if (
        htmlEl.hidden ||
        htmlEl.getAttribute('aria-hidden') === 'true' ||
        htmlEl.hasAttribute('inert')
      ) {
        return true;
      }

      const style = htmlEl.ownerDocument.defaultView?.getComputedStyle(htmlEl);
      if (
        style?.display === 'none' ||
        (htmlEl === element && (style?.visibility === 'hidden' || style?.visibility === 'collapse'))
      ) {
        return true;
      }
    }

    current = getComposedParent(current);
    depth += 1;
  }
  return false;
}

function collectShadowAwareElements(
  root: ParentNode,
  predicate: (el: HTMLElement) => boolean,
  visited = new Set<Element>(),
  out: HTMLElement[] = [],
): HTMLElement[] {
  for (const child of [...root.children]) {
    if (visited.has(child)) continue;

    if (
      child.tagName === 'SLOT' &&
      typeof (child as HTMLSlotElement).assignedElements === 'function'
    ) {
      visited.add(child);
      const assigned = (child as HTMLSlotElement).assignedElements({ flatten: true });
      if (assigned.length > 0) {
        for (const slotted of assigned) {
          if (visited.has(slotted)) continue;
          visited.add(slotted);
          if (slotted instanceof HTMLElement && predicate(slotted)) {
            out.push(slotted);
          }
          const slottedShadow = (slotted as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot;
          if (slottedShadow) {
            collectShadowAwareElements(slottedShadow, predicate, visited, out);
          } else {
            collectShadowAwareElements(slotted, predicate, visited, out);
          }
        }
        continue;
      }
      collectShadowAwareElements(child, predicate, visited, out);
      continue;
    }

    visited.add(child);
    const childShadow = (child as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot;
    if (
      child instanceof HTMLElement &&
      !(childShadow && childShadow.delegatesFocus) &&
      predicate(child)
    ) {
      out.push(child);
    }

    if (childShadow) {
      collectShadowAwareElements(childShadow, predicate, visited, out);
    } else {
      collectShadowAwareElements(child, predicate, visited, out);
    }
  }
  return out;
}

function getTabbableRoot(container: HTMLElement): ParentNode {
  const shadow = (container as HTMLElement & { shadowRoot?: ShadowRoot | null }).shadowRoot;
  return shadow && isShadowRoot(shadow) ? shadow : container;
}

function isRadioTabbable(element: HTMLElement, container: HTMLElement): boolean {
  if (element.tagName !== 'INPUT') return true;
  const input = element as HTMLInputElement;
  if (input.type !== 'radio' || !input.name) return true;

  const radios = collectShadowAwareElements(
    getTabbableRoot(container),
    (candidate) =>
      candidate.tagName === 'INPUT' &&
      (candidate as HTMLInputElement).type === 'radio' &&
      (candidate as HTMLInputElement).name === input.name &&
      (candidate as HTMLInputElement).form === input.form &&
      !(candidate as HTMLInputElement).disabled,
  ) as HTMLInputElement[];
  const checked = radios.find((radio) => radio.checked);
  return checked ? checked === input : radios[0] === input;
}

export function getTabbableCandidates(container: HTMLElement): HTMLElement[] {
  return collectShadowAwareElements(
    getTabbableRoot(container),
    (element) =>
      element.matches(TABBABLE) &&
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !isHiddenByTree(element) &&
      isRadioTabbable(element, container),
  ).sort((a, b) => {
    const aIndex = a.tabIndex;
    const bIndex = b.tabIndex;
    if (aIndex === bIndex) return 0;
    if (aIndex === 0) return 1;
    if (bIndex === 0) return -1;
    return aIndex - bIndex;
  });
}

export function focusFirst(container: HTMLElement, fallback = container): HTMLElement | null {
  const target = getTabbableCandidates(container)[0] ?? fallback;
  target.focus({ preventScroll: true });
  return target;
}

export class FocusTrap {
  private active = false;
  private previous: HTMLElement | null = null;

  private isTopTrap(): boolean {
    const doc = this.container ? ownerDocument(this.container) : undefined;
    return Boolean(doc && trapsByDocument.get(doc)?.at(-1) === this);
  }

  private readonly handleFocusIn = (event: FocusEvent) => {
    if (!this.container || !this.isTopTrap()) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const target = (path[0] ?? event.target) as Node | null;
    if (path.includes(this.container) || composedContains(this.container, target)) return;
    const first = getTabbableCandidates(this.container)[0] ?? this.container;
    first.focus({ preventScroll: true });
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !this.container || !this.isTopTrap()) return;

    const doc = ownerDocument(this.container);
    const tabbables = getTabbableCandidates(this.container);
    if (tabbables.length === 0) {
      event.preventDefault();
      this.container.focus({ preventScroll: true });
      return;
    }

    const first = tabbables[0]!;
    const last = tabbables[tabbables.length - 1]!;
    const current = getDeepActiveElement(doc);

    if (event.shiftKey && (current === first || !composedContains(this.container, current))) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (current === last || !composedContains(this.container, current))) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  constructor(
    private readonly container: HTMLElement | null,
    private readonly returnFocus = true,
  ) {}

  activate(initialFocus?: HTMLElement | null): void {
    if (this.active || !this.container) return;

    const doc = ownerDocument(this.container);
    if (!doc) return;

    this.active = true;
    const active = getDeepActiveElement(doc);
    this.previous = active?.nodeType === 1 ? (active as HTMLElement) : null;

    const stack = trapsByDocument.get(doc) ?? [];
    stack.push(this);
    trapsByDocument.set(doc, stack);
    doc.addEventListener('keydown', this.handleKeyDown, true);
    doc.addEventListener('focusin', this.handleFocusIn, true);

    const target = initialFocus?.isConnected
      ? initialFocus
      : getTabbableCandidates(this.container)[0] ?? this.container;
    target.focus({ preventScroll: true });
  }

  deactivate(restore = this.returnFocus): void {
    if (!this.active || !this.container) return;

    this.active = false;
    const doc = ownerDocument(this.container);
    doc?.removeEventListener('keydown', this.handleKeyDown, true);
    doc?.removeEventListener('focusin', this.handleFocusIn, true);

    if (doc) {
      const stack = trapsByDocument.get(doc) ?? [];
      const index = stack.lastIndexOf(this);
      if (index >= 0) stack.splice(index, 1);
      if (stack.length === 0) trapsByDocument.delete(doc);
    }

    if (restore && this.previous?.isConnected) {
      this.previous.focus({ preventScroll: true });
    }
    this.previous = null;
  }

  get isActive(): boolean {
    return this.active;
  }
}
