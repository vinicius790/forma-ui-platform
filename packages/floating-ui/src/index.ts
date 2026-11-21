import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  hide,
  offset,
  shift,
  size,
  type Middleware,
  type Placement,
  type Strategy,
} from '@floating-ui/dom';

export interface FloatingPositionResult {
  x: number;
  y: number;
  placement: Placement;
  strategy: Strategy;
  middlewareData: Record<string, unknown>;
}

export interface FloatingPositionOptions {
  placement?: Placement;
  strategy?: Strategy;
  offset?: number;
  flip?: boolean;
  shift?: boolean;
  shiftPadding?: number;
  matchReferenceWidth?: boolean;
  constrainHeight?: boolean;
  arrowElement?: HTMLElement | null;
  hideWhenReferenceHidden?: boolean;
  ancestorScroll?: boolean;
  ancestorResize?: boolean;
  elementResize?: boolean;
  layoutShift?: boolean;
  animationFrame?: boolean;
  onPosition?: (result: FloatingPositionResult) => void;
  onReferenceHidden?: (hidden: boolean) => void;
  onError?: (error: unknown) => void;
}

interface StyleSnapshot {
  element: HTMLElement;
  values: Map<string, { value: string; priority: string }>;
}

const touchedProperties = [
  'position', 'left', 'top', 'min-width', 'max-height', '--forma-reference-width',
  '--forma-arrow-x', '--forma-arrow-y', 'visibility',
];

function snapshotStyles(element: HTMLElement, properties: string[]): StyleSnapshot {
  return {
    element,
    values: new Map(properties.map((property) => [property, {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    }])),
  };
}

function restoreStyles(snapshot: StyleSnapshot): void {
  for (const [property, state] of snapshot.values) {
    if (state.value) snapshot.element.style.setProperty(property, state.value, state.priority);
    else snapshot.element.style.removeProperty(property);
  }
}

/**
 * Connect a mounted floating element to a reference element.
 *
 * The function does not render content or choose an accessibility pattern; it only
 * owns geometry. Call it while the floating element is mounted and visible, then
 * invoke `destroy()` when it closes or unmounts.
 */
export function connectFloatingPosition(
  reference: HTMLElement,
  floating: HTMLElement,
  options: FloatingPositionOptions = {},
) {
  if (reference.ownerDocument !== floating.ownerDocument) {
    throw new Error('Forma UI Floating UI: reference and floating elements must share an ownerDocument.');
  }

  const arrowElement = options.arrowElement ?? null;
  const floatingSnapshot = snapshotStyles(floating, touchedProperties);
  const arrowSnapshot = arrowElement ? snapshotStyles(arrowElement, ['position', 'left', 'top']) : null;
  const initialPlacement = floating.getAttribute('data-placement');
  const initialSide = floating.getAttribute('data-side');
  let disposed = false;
  let requestId = 0;
  let lastResult: FloatingPositionResult | undefined;

  const update = async (): Promise<FloatingPositionResult | undefined> => {
    if (disposed || !reference.isConnected || !floating.isConnected) return undefined;
    const currentRequest = ++requestId;
    const strategy = options.strategy ?? 'absolute';
    floating.style.position = strategy;

    const middleware: Middleware[] = [offset(options.offset ?? 8)];
    if (options.flip !== false) middleware.push(flip({ padding: options.shiftPadding ?? 8 }));
    if (options.shift !== false) middleware.push(shift({ padding: options.shiftPadding ?? 8 }));

    if (options.matchReferenceWidth || options.constrainHeight) {
      middleware.push(size({
        padding: options.shiftPadding ?? 8,
        apply({ availableHeight, rects, elements }) {
          if (options.matchReferenceWidth) {
            elements.floating.style.minWidth = `${rects.reference.width}px`;
            elements.floating.style.setProperty('--forma-reference-width', `${rects.reference.width}px`);
          }
          if (options.constrainHeight) {
            elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
          }
        },
      }));
    }

    if (arrowElement) middleware.push(arrowMiddleware({ element: arrowElement }));
    if (options.hideWhenReferenceHidden) middleware.push(hide());

    try {
      const result = await computePosition(reference, floating, {
        placement: options.placement ?? 'bottom-start',
        strategy,
        middleware,
      });
      if (disposed || currentRequest !== requestId || !reference.isConnected || !floating.isConnected) return undefined;

      floating.style.left = `${result.x}px`;
      floating.style.top = `${result.y}px`;
      floating.dataset['placement'] = result.placement;
      floating.dataset['side'] = result.placement.split('-')[0] ?? 'bottom';

      if (arrowElement) {
        const arrowData = result.middlewareData['arrow'] as { x?: number; y?: number } | undefined;
        arrowElement.style.position = 'absolute';
        if (arrowData?.x !== undefined) {
          arrowElement.style.left = `${arrowData.x}px`;
          arrowElement.style.top = '';
          floating.style.setProperty('--forma-arrow-x', `${arrowData.x}px`);
        }
        if (arrowData?.y !== undefined) {
          arrowElement.style.top = `${arrowData.y}px`;
          arrowElement.style.left = '';
          floating.style.setProperty('--forma-arrow-y', `${arrowData.y}px`);
        }
      }

      const referenceHidden = Boolean((result.middlewareData['hide'] as { referenceHidden?: boolean } | undefined)?.referenceHidden);
      if (options.hideWhenReferenceHidden) {
        floating.style.visibility = referenceHidden ? 'hidden' : 'visible';
        options.onReferenceHidden?.(referenceHidden);
      }

      const normalized: FloatingPositionResult = {
        x: result.x,
        y: result.y,
        placement: result.placement,
        strategy: result.strategy,
        middlewareData: result.middlewareData,
      };
      lastResult = normalized;
      options.onPosition?.(normalized);
      return normalized;
    } catch (error) {
      if (!disposed && currentRequest === requestId) options.onError?.(error);
      return undefined;
    }
  };

  const stopAutoUpdate = autoUpdate(reference, floating, () => { void update(); }, {
    ancestorScroll: options.ancestorScroll ?? true,
    ancestorResize: options.ancestorResize ?? true,
    elementResize: options.elementResize ?? true,
    layoutShift: options.layoutShift ?? true,
    animationFrame: options.animationFrame ?? false,
  });

  return {
    reference,
    floating,
    update,
    get lastResult() { return lastResult; },
    destroy() {
      if (disposed) return;
      disposed = true;
      requestId += 1;
      stopAutoUpdate();
      restoreStyles(floatingSnapshot);
      if (arrowSnapshot) restoreStyles(arrowSnapshot);
      if (initialPlacement === null) floating.removeAttribute('data-placement');
      else floating.setAttribute('data-placement', initialPlacement);
      if (initialSide === null) floating.removeAttribute('data-side');
      else floating.setAttribute('data-side', initialSide);
    },
  };
}

export type { Placement, Strategy };

export interface VirtualAnchorPoint {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/** Creates a Floating UI compatible VirtualElement for cursor, ContextMenu, or text-selection anchoring. */
export function createVirtualAnchor(point: VirtualAnchorPoint) {
  const width = point.width ?? 0;
  const height = point.height ?? 0;
  return {
    getBoundingClientRect(): DOMRect {
      return {
        x: point.x,
        y: point.y,
        top: point.y,
        left: point.x,
        right: point.x + width,
        bottom: point.y + height,
        width,
        height,
        toJSON() {
          return this;
        },
      };
    },
  };
}

/** Feature detector for native CSS Anchor Positioning (`anchor-name` / `position-anchor`). */
export function supportsCssAnchorPositioning(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('anchor-name', '--forma');
}

export * from './safe-polygon-and-anchor';
