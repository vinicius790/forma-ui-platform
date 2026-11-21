export type Orientation = 'horizontal' | 'vertical' | 'both';
export type Direction = 'ltr' | 'rtl';

export interface RovingItem {
  id: string;
  disabled?: boolean;
}

export interface RovingTabIndexOptions {
  orientation?: Orientation;
  dir?: Direction;
  loop?: boolean;
}

export function getNextRovingIndex(
  items: readonly RovingItem[],
  currentIndex: number,
  key: string,
  options: RovingTabIndexOptions = {}
): number | null {
  const { orientation = 'horizontal', dir = 'ltr', loop = true } = options;
  const count = items.length;
  if (count === 0) return null;

  const isHorizontal = orientation === 'horizontal' || orientation === 'both';
  const isVertical = orientation === 'vertical' || orientation === 'both';

  const prevHorizontalKey = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  const nextHorizontalKey = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';

  let direction: 1 | -1 | 'first' | 'last' | null = null;

  if (key === 'Home') {
    direction = 'first';
  } else if (key === 'End') {
    direction = 'last';
  } else if (isHorizontal && key === nextHorizontalKey) {
    direction = 1;
  } else if (isHorizontal && key === prevHorizontalKey) {
    direction = -1;
  } else if (isVertical && key === 'ArrowDown') {
    direction = 1;
  } else if (isVertical && key === 'ArrowUp') {
    direction = -1;
  }

  if (direction === null) return null;

  const findEnabledFrom = (start: number, step: 1 | -1): number | null => {
    let idx = start;
    for (let i = 0; i < count; i++) {
      if (idx < 0 || idx >= count) {
        if (!loop) return null;
        idx = (idx + count) % count;
      }
      if (!items[idx]?.disabled) {
        return idx;
      }
      idx += step;
    }
    return null;
  };

  if (direction === 'first') {
    return findEnabledFrom(0, 1);
  }
  if (direction === 'last') {
    return findEnabledFrom(count - 1, -1);
  }

  const startIndex =
    currentIndex < 0 ? (direction === 1 ? 0 : count - 1) : currentIndex + direction;
  return findEnabledFrom(startIndex, direction);
}
