import { describe, it, expect } from 'vitest';
import {
  getContrastRatio,
  evaluateWcagContrast,
  semanticColorsLight
} from './index.js';

describe('@forma-ui/tokens WCAG 2.1 Contrast Verification', () => {
  it('calculates exact 21:1 contrast ratio for pure black and white', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBe(21);
  });

  it('verifies default light semantic tokens pass WCAG AA text contrast', () => {
    const primaryEval = evaluateWcagContrast(
      semanticColorsLight.fgPrimary,
      semanticColorsLight.bgCanvas
    );
    expect(primaryEval.passesAA).toBe(true);
    expect(primaryEval.passesAAA).toBe(true);

    const secondaryEval = evaluateWcagContrast(
      semanticColorsLight.fgSecondary,
      semanticColorsLight.bgCanvas
    );
    expect(secondaryEval.passesAA).toBe(true);
  });
});
