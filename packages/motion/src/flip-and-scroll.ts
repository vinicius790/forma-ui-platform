/**
 * Forma UI 50.0.0 WAAPI FLIP layout transition helpers, CSS scroll-timeline generator,
 * and stagger delay calculator. All DOM access is deferred to runtime calls for SSR safety.
 */

export interface FlipRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface FlipDelta {
  readonly dx: number;
  readonly dy: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly isIdentity: boolean;
}

export interface FlipAnimationOptions {
  duration?: number;
  easing?: string;
  respectReducedMotion?: boolean;
}

export type ScrollTimelineAxis = 'block' | 'inline' | 'x' | 'y';

/** Captures an element's viewport bounding box ("First" phase of FLIP). */
export function captureFlipRect(
  element: Pick<Element, 'getBoundingClientRect'> | null,
): FlipRect | null {
  if (!element || typeof element.getBoundingClientRect !== 'function') return null;
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/** Computes the inverse translation and scale transform delta between First and Last rects. */
export function computeFlipDelta(first: FlipRect, last: FlipRect): FlipDelta {
  const dx = first.left - last.left;
  const dy = first.top - last.top;
  const scaleX = last.width > 0 ? first.width / last.width : 1;
  const scaleY = last.height > 0 ? first.height / last.height : 1;
  const isIdentity =
    Math.abs(dx) < 0.5 &&
    Math.abs(dy) < 0.5 &&
    Math.abs(scaleX - 1) < 0.005 &&
    Math.abs(scaleY - 1) < 0.005;
  return { dx, dy, scaleX, scaleY, isIdentity };
}

/**
 * Plays a Web Animations API FLIP layout transition from `first` to the element's current rect.
 * Collapses duration to 0ms when `prefers-reduced-motion: reduce` is active (unless disabled).
 */
export function playFlipAnimation(
  element: HTMLElement | null,
  first: FlipRect | null,
  options: FlipAnimationOptions = {},
): Animation | null {
  if (!element || !first || typeof element.animate !== 'function') return null;
  const last = captureFlipRect(element);
  if (!last) return null;
  const delta = computeFlipDelta(first, last);
  if (delta.isIdentity) return null;

  const respectReduced = options.respectReducedMotion ?? true;
  const win = element.ownerDocument?.defaultView ?? (typeof window !== 'undefined' ? window : undefined);
  const reduced =
    respectReduced &&
    typeof win?.matchMedia === 'function' &&
    win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const duration = reduced ? 0 : (options.duration ?? 220);
  const easing = options.easing ?? 'cubic-bezier(0.2, 0, 0, 1)';

  return element.animate(
    [
      {
        transformOrigin: 'top left',
        transform: `translate3d(${delta.dx}px, ${delta.dy}px, 0) scale(${delta.scaleX}, ${delta.scaleY})`,
      },
      {
        transformOrigin: 'top left',
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
      },
    ],
    { duration, easing, fill: 'none' },
  );
}

/** Generates progressive-enhancement CSS Scroll-Driven Animation (`scroll-timeline`) rules. */
export function createScrollTimelineCss(name: string, axis: ScrollTimelineAxis = 'block'): string {
  const safeName = name.trim().replace(/^--/u, '').replace(/[^a-zA-Z0-9_-]+/gu, '-') || 'forma-scroll';
  const timelineName = `--${safeName}`;
  return [
    '@supports (animation-timeline: scroll()) {',
    `  [data-forma-scroll-container="${safeName}"] {`,
    `    scroll-timeline-name: ${timelineName};`,
    `    scroll-timeline-axis: ${axis};`,
    '  }',
    `  [data-forma-scroll-target="${safeName}"] {`,
    `    animation-timeline: ${timelineName};`,
    '  }',
    '}',
  ].join('\n');
}

/** Computes a bounded stagger delay in milliseconds for sequential list/grid entrance animations. */
export function computeStaggerDelay(index: number, baseMs: number, maxMs?: number): number {
  const safeIndex = Math.max(0, Math.floor(index));
  const safeBase = Math.max(0, baseMs);
  const delay = safeIndex * safeBase;
  if (maxMs !== undefined && Number.isFinite(maxMs)) {
    return Math.min(Math.max(0, maxMs), delay);
  }
  return delay;
}
