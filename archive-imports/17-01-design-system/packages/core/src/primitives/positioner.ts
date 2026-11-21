import type { Direction } from './roving-tabindex.js';

export type FloatingSide = 'top' | 'bottom' | 'left' | 'right';
export type FloatingAlign = 'start' | 'center' | 'end';
export type FloatingPlacement =
  | FloatingSide
  | `${FloatingSide}-${Exclude<FloatingAlign, 'center'>}`;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionOptions {
  placement?: FloatingPlacement;
  offset?: number;
  flip?: boolean;
  shiftPadding?: number;
  viewport?: { width: number; height: number };
  dir?: Direction;
}

export interface ComputedPosition {
  x: number;
  y: number;
  placement: FloatingPlacement;
  side: FloatingSide;
  align: FloatingAlign;
}

function parsePlacement(placement: FloatingPlacement): {
  side: FloatingSide;
  align: FloatingAlign;
} {
  const parts = placement.split('-') as [FloatingSide, ('start' | 'end')?];
  return {
    side: parts[0],
    align: parts[1] ?? 'center'
  };
}

function getOppositeSide(side: FloatingSide): FloatingSide {
  switch (side) {
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

/**
 * Motor leve e determinístico de posicionamento flutuante (Menu, Select, Tooltip)
 * com detecção de colisão de viewport, flip automático e espelhamento RTL.
 */
export function computeFloatingPosition(
  anchor: Rect,
  floating: { width: number; height: number },
  options: PositionOptions = {}
): ComputedPosition {
  const {
    placement = 'bottom-start',
    offset = 6,
    flip = true,
    shiftPadding = 8,
    viewport = { width: 1024, height: 768 },
    dir = 'ltr'
  } = options;

  let { side, align } = parsePlacement(placement);

  // Mirror start/end on horizontal axis when in RTL
  const effectiveAlign: FloatingAlign =
    dir === 'rtl' && (side === 'top' || side === 'bottom')
      ? align === 'start'
        ? 'end'
        : align === 'end'
          ? 'start'
          : 'center'
      : align;

  const computeCoords = (targetSide: FloatingSide): { x: number; y: number } => {
    let x = 0;
    let y = 0;

    if (targetSide === 'top' || targetSide === 'bottom') {
      y =
        targetSide === 'top'
          ? anchor.y - floating.height - offset
          : anchor.y + anchor.height + offset;

      if (effectiveAlign === 'start') {
        x = anchor.x;
      } else if (effectiveAlign === 'end') {
        x = anchor.x + anchor.width - floating.width;
      } else {
        x = anchor.x + anchor.width / 2 - floating.width / 2;
      }
    } else {
      x =
        targetSide === 'left'
          ? anchor.x - floating.width - offset
          : anchor.x + anchor.width + offset;

      if (align === 'start') {
        y = anchor.y;
      } else if (align === 'end') {
        y = anchor.y + anchor.height - floating.height;
      } else {
        y = anchor.y + anchor.height / 2 - floating.height / 2;
      }
    }

    return { x, y };
  };

  let coords = computeCoords(side);

  if (flip) {
    const overflowsTop = side === 'top' && coords.y < shiftPadding;
    const overflowsBottom =
      side === 'bottom' && coords.y + floating.height > viewport.height - shiftPadding;
    const overflowsLeft = side === 'left' && coords.x < shiftPadding;
    const overflowsRight =
      side === 'right' && coords.x + floating.width > viewport.width - shiftPadding;

    if (overflowsTop || overflowsBottom || overflowsLeft || overflowsRight) {
      const opposite = getOppositeSide(side);
      const candidate = computeCoords(opposite);
      side = opposite;
      coords = candidate;
    }
  }

  // Clamp within viewport padding
  const clampedX = Math.min(
    Math.max(shiftPadding, coords.x),
    Math.max(shiftPadding, viewport.width - floating.width - shiftPadding)
  );
  const clampedY = Math.min(
    Math.max(shiftPadding, coords.y),
    Math.max(shiftPadding, viewport.height - floating.height - shiftPadding)
  );

  const finalPlacement: FloatingPlacement =
    align === 'center' ? side : `${side}-${align}`;

  return {
    x: Math.round(clampedX),
    y: Math.round(clampedY),
    placement: finalPlacement,
    side,
    align
  };
}
