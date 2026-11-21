export interface MotionDurations { instant: string; fast: string; normal: string; slow: string }
export interface MotionOptions { durations?: Partial<MotionDurations>; easing?: string; disabled?: boolean }
export const defaultMotionDurations: MotionDurations = Object.freeze({ instant: '0ms', fast: '120ms', normal: '180ms', slow: '260ms' });

export function createMotionTokens(options: MotionOptions = {}): MotionDurations {
  return { ...defaultMotionDurations, ...options.durations };
}

/** CSS helper is opt-in; import it explicitly in the visual layer. */
export function createMotionCss(options: MotionOptions = {}): string {
  const durations = createMotionTokens(options);
  if (options.disabled) return ':root { --forma-motion-fast: 0ms; --forma-motion-normal: 0ms; --forma-motion-slow: 0ms; }';
  return `:root {\n  --forma-motion-instant: ${durations.instant};\n  --forma-motion-fast: ${durations.fast};\n  --forma-motion-normal: ${durations.normal};\n  --forma-motion-slow: ${durations.slow};\n  --forma-motion-easing: ${options.easing ?? 'cubic-bezier(0.2, 0, 0, 1)'};\n}\n@media (prefers-reduced-motion: reduce) {\n  :root { --forma-motion-fast: 0ms; --forma-motion-normal: 0ms; --forma-motion-slow: 0ms; }\n  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }\n}`;
}

export interface MotionPreference { readonly reduced: boolean; subscribe(listener: (reduced: boolean) => void): () => void; destroy(): void }

/** Creates a listener only when explicitly called; safe to import during SSR. */
export function observeReducedMotion(view: Pick<Window, 'matchMedia'> | undefined = typeof window === 'undefined' ? undefined : window): MotionPreference {
  const media = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced = media?.matches ?? false;
  const listeners = new Set<(value: boolean) => void>();
  const onChange = (event: MediaQueryListEvent) => {
    reduced = event.matches;
    for (const listener of [...listeners]) listener(reduced);
  };
  media?.addEventListener?.('change', onChange);
  return {
    get reduced() { return reduced; },
    subscribe(listener) { listeners.add(listener); listener(reduced); return () => listeners.delete(listener); },
    destroy() { media?.removeEventListener?.('change', onChange); listeners.clear(); },
  };
}

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

/** Estimates settling duration in milliseconds for a damped harmonic spring. */
export function estimateSpringDurationMs(config: SpringConfig = {}): number {
  const stiffness = Math.max(1, config.stiffness ?? 220);
  const damping = Math.max(1, config.damping ?? 26);
  const mass = Math.max(0.1, config.mass ?? 1);
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const settlingSeconds = zeta >= 1 ? (6 * zeta) / omega0 : 4.6 / (zeta * omega0);
  return Math.round(Math.min(2000, Math.max(60, settlingSeconds * 1000)));
}

/**
 * Progressive View Transitions API helper.
 * Respects `prefers-reduced-motion` and falls back to executing `update()` directly during SSR or unsupported browsers.
 */
export function withViewTransition<T>(
  update: () => T | Promise<T>,
  options: { document?: Document; respectReducedMotion?: boolean } = {},
): Promise<T> {
  const doc = options.document ?? (typeof document === 'undefined' ? undefined : document);
  const respectReduced = options.respectReducedMotion ?? true;
  const reduced =
    respectReduced &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startViewTransition = (doc as (Document & { startViewTransition?: (cb: () => unknown) => { finished: Promise<void> } }) | undefined)
    ?.startViewTransition;

  if (!doc || reduced || typeof startViewTransition !== 'function') {
    return Promise.resolve().then(update);
  }

  let result!: T | Promise<T>;
  const transition = startViewTransition.call(doc, () => {
    result = update();
    return result;
  });
  return transition.finished.then(() => result);
}

/**
 * Integrates a damped harmonic spring (RK4-like semi-implicit Euler) from 0 to 1
 * and returns normalized progress samples suitable for CSS `linear(...)` easing or WAAPI keyframes.
 */
export function solveSpringKeyframes(config: SpringConfig = {}, samples = 32): number[] {
  const stiffness = Math.max(1, config.stiffness ?? 220);
  const damping = Math.max(1, config.damping ?? 26);
  const mass = Math.max(0.1, config.mass ?? 1);
  const durationSec = estimateSpringDurationMs(config) / 1000;
  const count = Math.max(4, Math.min(128, Math.trunc(samples)));
  const dt = durationSec / (count - 1);
  const values: number[] = [0];
  let x = 0;
  let v = 0;
  for (let i = 1; i < count; i += 1) {
    const force = -stiffness * (x - 1) - damping * v;
    v += (force / mass) * dt;
    x += v * dt;
    values.push(Math.round(x * 10000) / 10000);
  }
  values[values.length - 1] = 1;
  return values;
}

/** Converts a physical spring configuration into a standards-compliant CSS `linear(...)` timing function. */
export function createSpringLinearEasing(config: SpringConfig = {}, samples = 24): string {
  return `linear(${solveSpringKeyframes(config, samples).join(', ')})`;
}

/**
 * Progressive Web Animations API helper that collapses duration to 0ms when `prefers-reduced-motion: reduce` is active.
 */
export function animateWithMotionGuard(
  element: HTMLElement | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions = {},
): Animation | null {
  if (!element || typeof element.animate !== 'function') return null;
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return element.animate(keyframes, reduced ? { ...options, duration: 0, delay: 0 } : options);
}

export * from './flip-and-scroll';
