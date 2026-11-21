export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface PositionResult {
  x: number;
  y: number;
  placement: Placement;
  maxWidth: number;
  maxHeight: number;
}

export interface PositionOptions {
  placement?: Placement;
  offset?: number;
  padding?: number;
  direction?: 'ltr' | 'rtl';
  /** Explicit viewport dimensions are useful for deterministic tests and embedded documents. */
  viewportWidth?: number;
  viewportHeight?: number;
}

export function computePosition(
  reference: DOMRect,
  floating: DOMRect,
  options: PositionOptions = {},
): PositionResult {
  const viewportW = options.viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const viewportH = options.viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 768);
  const pad = Math.max(0, options.padding ?? 8);
  const gap = Math.max(0, options.offset ?? 6);
  let placement = options.placement ?? 'bottom';

  const fits = (side: Placement): boolean => {
    if (side === 'top') return reference.top >= floating.height + gap + pad;
    if (side === 'bottom') return viewportH - reference.bottom >= floating.height + gap + pad;
    if (side === 'left') return reference.left >= floating.width + gap + pad;
    return viewportW - reference.right >= floating.width + gap + pad;
  };

  if (!fits(placement)) {
    const opposite: Record<Placement, Placement> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    if (fits(opposite[placement])) placement = opposite[placement];
  }

  let x = reference.left;
  let y = reference.bottom + gap;
  if (placement === 'top') y = reference.top - floating.height - gap;
  if (placement === 'left') {
    x = reference.left - floating.width - gap;
    y = reference.top + (reference.height - floating.height) / 2;
  }
  if (placement === 'right') {
    x = reference.right + gap;
    y = reference.top + (reference.height - floating.height) / 2;
  }
  if (placement === 'top' || placement === 'bottom') {
    x = options.direction === 'rtl' ? reference.right - floating.width : reference.left;
  }

  const maxX = Math.max(pad, viewportW - floating.width - pad);
  const maxY = Math.max(pad, viewportH - floating.height - pad);
  x = Math.min(Math.max(pad, x), maxX);
  y = Math.min(Math.max(pad, y), maxY);

  return {
    x,
    y,
    placement,
    maxWidth: Math.max(0, viewportW - 2 * pad),
    maxHeight: Math.max(0, viewportH - 2 * pad),
  };
}

export function positionElement(
  reference: HTMLElement,
  floating: HTMLElement,
  options: Omit<PositionOptions, 'viewportWidth' | 'viewportHeight'> = {},
): PositionResult {
  const view = reference.ownerDocument.defaultView;
  const result = computePosition(
    reference.getBoundingClientRect(),
    floating.getBoundingClientRect(),
    {
      ...options,
      viewportWidth: view?.innerWidth,
      viewportHeight: view?.innerHeight,
    },
  );

  Object.assign(floating.style, {
    position: 'fixed',
    left: `${result.x}px`,
    top: `${result.y}px`,
    maxWidth: `${result.maxWidth}px`,
    maxHeight: `${result.maxHeight}px`,
  });
  floating.dataset['placement'] = result.placement;
  return result;
}
