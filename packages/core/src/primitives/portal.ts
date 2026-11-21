export interface PortalOptions {
  container?: HTMLElement | null;
  id?: string;
  inheritDirection?: boolean;
}

export function createPortal(
  options: PortalOptions = {},
): { element: HTMLDivElement; destroy: () => void } | null {
  const doc = options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document);
  if (!doc) return null;

  const element = doc.createElement('div');
  if (options.id) element.id = options.id;

  if (options.inheritDirection !== false) {
    const direction = options.container?.closest<HTMLElement>('[dir]')?.getAttribute('dir')
      || doc.documentElement.getAttribute('dir');
    const language = options.container?.closest<HTMLElement>('[lang]')?.getAttribute('lang')
      || doc.documentElement.getAttribute('lang');
    if (direction) element.dir = direction;
    if (language) element.lang = language;
  }

  (options.container ?? doc.body).append(element);
  let destroyed = false;
  return {
    element,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      element.remove();
    },
  };
}
