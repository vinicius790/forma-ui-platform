/**
 * Modern CSS design tokens for Forma UI 1.0:
 * - Perceptual OKLCH color ramp
 * - CSS Container Query breakpoints
 * - Fluid typography (`clamp()`) generator
 */

export const oklchPalette = Object.freeze({
  brand: {
    50: 'oklch(0.97 0.015 255)',
    100: 'oklch(0.93 0.035 255)',
    300: 'oklch(0.78 0.11 255)',
    500: 'oklch(0.58 0.19 255)',
    700: 'oklch(0.44 0.16 255)',
    900: 'oklch(0.28 0.09 255)',
  },
  neutral: {
    50: 'oklch(0.985 0.002 255)',
    100: 'oklch(0.955 0.004 255)',
    300: 'oklch(0.84 0.008 255)',
    500: 'oklch(0.56 0.012 255)',
    700: 'oklch(0.35 0.012 255)',
    900: 'oklch(0.18 0.01 255)',
  },
  semantic: {
    success: 'oklch(0.58 0.16 148)',
    warning: 'oklch(0.74 0.16 78)',
    danger: 'oklch(0.56 0.21 25)',
    info: 'oklch(0.60 0.16 245)',
  },
});

export const containerBreakpoints = Object.freeze({
  xs: '20rem',
  sm: '28rem',
  md: '40rem',
  lg: '56rem',
  xl: '72rem',
});

export interface FluidTypeOptions {
  minRem: number;
  maxRem: number;
  minViewportRem?: number;
  maxViewportRem?: number;
}

/** Generates a CSS `clamp()` expression for fluid typography using rem + vw units. */
export function createFluidTypeValue(options: FluidTypeOptions): string {
  const minVp = options.minViewportRem ?? 20;
  const maxVp = options.maxViewportRem ?? 80;
  const slope = ((options.maxRem - options.minRem) / (maxVp - minVp)) * 100;
  const intercept = options.minRem - (slope / 100) * minVp;
  return `clamp(${options.minRem}rem, ${intercept.toFixed(4)}rem + ${slope.toFixed(4)}vw, ${options.maxRem}rem)`;
}
