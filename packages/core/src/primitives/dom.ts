export type AnyHandler<E = Event> = ((event: E) => void) | undefined;

export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  theirs?: (event: E) => void,
  ours?: (event: E) => void,
  options: { checkDefaultPrevented?: boolean } = {},
): (event: E) => void {
  return (event) => {
    theirs?.(event);
    if (options.checkDefaultPrevented !== false && event.defaultPrevented) return;
    ours?.(event);
  };
}

export function isElement(value: unknown): value is Element {
  return typeof Element !== 'undefined' && value instanceof Element;
}

export function isShadowRoot(value: unknown): value is ShadowRoot {
  return typeof ShadowRoot !== 'undefined' && value instanceof ShadowRoot;
}

/** Returns the parent node in the composed DOM tree, crossing ShadowRoot hosts and slots. */
export function getComposedParent(node: Node): Node | null {
  if (isElement(node) && 'assignedSlot' in node && node.assignedSlot) {
    return node.assignedSlot;
  }
  if (isShadowRoot(node)) {
    return node.host;
  }
  return node.parentNode;
}

/** Checks whether `target` is inside `container`, crossing open/closed ShadowRoot boundaries. */
export function composedContains(container: Node | null | undefined, target: Node | null | undefined): boolean {
  if (!container || !target) return false;
  if (container === target) return true;
  if (typeof container.contains === 'function' && container.contains(target)) {
    return true;
  }

  let current: Node | null = target;
  let depth = 0;
  while (current && depth < 1024) {
    if (current === container) return true;
    current = getComposedParent(current);
    depth += 1;
  }
  return false;
}

/** Resolves the deepest active element across nested open ShadowRoots. */
export function getDeepActiveElement(doc?: Document | null): Element | null {
  let active = doc?.activeElement ?? null;
  let depth = 0;
  while (active && depth < 64) {
    const shadowActive = (active as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot?.activeElement ?? null;
    if (!shadowActive || shadowActive === active) break;
    active = shadowActive;
    depth += 1;
  }
  return active;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!isElement(target)) return false;
  const element = target as HTMLElement;
  return element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) || element.getAttribute('role') === 'textbox';
}

export function ownerDocument(node?: Node | null): Document | undefined {
  if (!node) return typeof document === 'undefined' ? undefined : document;
  return node.ownerDocument ?? (node as Document);
}

export function setRef<T>(ref: ((value: T | null) => void) | { current: T | null } | null | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}
