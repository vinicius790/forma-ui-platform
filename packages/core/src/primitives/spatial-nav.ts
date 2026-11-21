export type SpatialDirection = 'up' | 'down' | 'left' | 'right';

export interface SpatialRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 2D directional focus navigation solver (TV, gamepad, canvas, bento grids).
 * Scores candidates by primary-axis distance + orthogonal penalty.
 */
export function findSpatialCandidate(
  current: SpatialRect,
  candidates: readonly SpatialRect[],
  direction: SpatialDirection,
): SpatialRect | null {
  const cx = current.x + current.width / 2;
  const cy = current.y + current.height / 2;
  let best: SpatialRect | null = null;
  let bestScore = Infinity;

  for (const item of candidates) {
    if (item.id === current.id) continue;
    const tx = item.x + item.width / 2;
    const ty = item.y + item.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    const primary = direction === 'right' ? dx : direction === 'left' ? -dx : direction === 'down' ? dy : -dy;
    if (primary <= 0) continue;
    const ortho = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    const score = primary + ortho * 2.5;
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}
