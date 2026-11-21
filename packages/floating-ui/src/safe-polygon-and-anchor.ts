/**
 * Forma UI 50.0.0 safe-polygon pointer geometry (for nested submenus and hover cards)
 * and CSS Anchor Positioning style helper.
 */
import type { Placement } from '@floating-ui/dom';

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface CssAnchorStyles {
  readonly anchorName: string;
  readonly positionAnchor: string;
  readonly positionArea: string;
  readonly positionTryFallbacks: string;
  readonly reference: Readonly<Record<string, string>>;
  readonly floating: Readonly<Record<string, string>>;
}

function isPointOnSegment(point: Point2D, a: Point2D, b: Point2D): boolean {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 1e-6) return false;
  const minX = Math.min(a.x, b.x) - 1e-6;
  const maxX = Math.max(a.x, b.x) + 1e-6;
  const minY = Math.min(a.y, b.y) - 1e-6;
  const maxY = Math.max(a.y, b.y) + 1e-6;
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

/**
 * Ray-casting point-in-polygon check for nested submenu / hover-card safe-triangle geometry.
 * Returns `true` when `point` lies inside or on the boundary of `polygon`.
 */
export function isPointInSafePolygon(point: Point2D, polygon: readonly Point2D[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    if (isPointOnSegment(point, pi, pj)) return true;
    const intersects =
      (pi.y > point.y) !== (pj.y > point.y) &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

const PLACEMENT_TO_POSITION_AREA: Record<Placement, string> = {
  top: 'top',
  'top-start': 'top span-right',
  'top-end': 'top span-left',
  bottom: 'bottom',
  'bottom-start': 'bottom span-right',
  'bottom-end': 'bottom span-left',
  left: 'left',
  'left-start': 'left span-bottom',
  'left-end': 'left span-top',
  right: 'right',
  'right-start': 'right span-bottom',
  'right-end': 'right span-top',
};

/**
 * Generates native CSS Anchor Positioning styles (`anchor-name`, `position-anchor`,
 * `position-area`, and `position-try-fallbacks`) corresponding to a Floating UI `Placement`.
 */
export function createCssAnchorStyles(
  anchorName: string,
  placement: Placement = 'bottom-start',
): CssAnchorStyles {
  const clean = anchorName.trim().replace(/^--/u, '').replace(/[^a-zA-Z0-9_-]+/gu, '-') || 'forma-anchor';
  const normalizedName = `--${clean}`;
  const positionArea = PLACEMENT_TO_POSITION_AREA[placement] ?? 'bottom span-right';
  const horizontal = placement.startsWith('left') || placement.startsWith('right');
  const positionTryFallbacks = horizontal ? 'flip-inline, flip-block' : 'flip-block, flip-inline';

  return {
    anchorName: normalizedName,
    positionAnchor: normalizedName,
    positionArea,
    positionTryFallbacks,
    reference: Object.freeze({
      'anchor-name': normalizedName,
    }),
    floating: Object.freeze({
      position: 'fixed',
      'position-anchor': normalizedName,
      'position-area': positionArea,
      'position-try-fallbacks': positionTryFallbacks,
    }),
  };
}
