import { describe, expect, it } from 'vitest';
import {
  captureFlipRect,
  computeFlipDelta,
  computeStaggerDelay,
  createMotionCss,
  createMotionTokens,
  createScrollTimelineCss,
  observeReducedMotion,
} from '../index';

describe('motion preference and tokens', () => {
  it('merges duration tokens and emits a reduced-motion override', () => {
    expect(createMotionTokens({ durations: { fast: '80ms' } }).fast).toBe('80ms');
    const css = createMotionCss();
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('animation-duration: 0.01ms');
  });
  it('does not require window when no browser is available', () => {
    const preference = observeReducedMotion(undefined);
    expect(preference.reduced).toBe(false);
    preference.destroy();
  });
  it('computes FLIP deltas, stagger delays, and scroll-timeline CSS', () => {
    const first = captureFlipRect({ getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 50 } as DOMRect) })!;
    const delta = computeFlipDelta(first, { left: 60, top: 20, width: 200, height: 50 });
    expect(delta.dx).toBe(-50);
    expect(delta.scaleX).toBe(0.5);
    expect(computeStaggerDelay(5, 30, 100)).toBe(100);
    expect(createScrollTimelineCss('article', 'block')).toContain('scroll-timeline-name: --article;');
  });
});
