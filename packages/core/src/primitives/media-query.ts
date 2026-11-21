export interface MediaQuerySubscription {
  matches: () => boolean;
  destroy: () => void;
}

export function matchMediaQuery(query: string, win?: Window): boolean {
  const target = win ?? (typeof window !== 'undefined' ? window : undefined);
  if (!target || typeof target.matchMedia !== 'function') return false;
  return target.matchMedia(query).matches;
}

export function observeMediaQuery(
  query: string,
  onChange: (matches: boolean) => void,
  win?: Window,
): MediaQuerySubscription {
  const target = win ?? (typeof window !== 'undefined' ? window : undefined);
  if (!target || typeof target.matchMedia !== 'function') {
    return { matches: () => false, destroy: () => {} };
  }
  const mql = target.matchMedia(query);
  let active = true;
  const handler = (event: MediaQueryListEvent) => {
    if (active) onChange(event.matches);
  };
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', handler);
  }
  return {
    matches: () => mql.matches,
    destroy: () => {
      if (!active) return;
      active = false;
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', handler);
      }
    },
  };
}

export function prefersReducedMotion(win?: Window): boolean {
  return matchMediaQuery('(prefers-reduced-motion: reduce)', win);
}

export function prefersForcedColors(win?: Window): boolean {
  return matchMediaQuery('(forced-colors: active)', win);
}

export function prefersDarkColorScheme(win?: Window): boolean {
  return matchMediaQuery('(prefers-color-scheme: dark)', win);
}
