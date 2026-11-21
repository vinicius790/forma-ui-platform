export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getOwnerDocument(element?: Element | null): Document {
  return element?.ownerDocument ?? (typeof document !== 'undefined' ? document : ({} as Document));
}

export function getOwnerWindow(element?: Element | null): Window {
  const doc = getOwnerDocument(element);
  return doc.defaultView ?? window;
}

export function isHTMLElement(node: unknown): node is HTMLElement {
  return typeof HTMLElement !== 'undefined' && node instanceof HTMLElement;
}

export function containsElement(parent: Element | null | undefined, child: EventTarget | null): boolean {
  if (!parent || !child || !(child instanceof Node)) return false;
  return parent === child || parent.contains(child);
}

export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined;
}

export function composeEventHandlers<E extends { defaultPrevented?: boolean }>(
  externalHandler?: ((event: E) => void) | undefined,
  internalHandler?: ((event: E) => void) | undefined,
  { checkDefaultPrevented = true }: { checkDefaultPrevented?: boolean } = {}
): (event: E) => void {
  return (event: E) => {
    externalHandler?.(event);
    if (!checkDefaultPrevented || !event.defaultPrevented) {
      internalHandler?.(event);
    }
  };
}
