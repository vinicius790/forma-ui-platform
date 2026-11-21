import { describe, expect, it } from 'vitest';
import { flattenTokens, toCssVariables, toDTCG } from './css-vars';
import { primitiveColors, semanticColors } from './colors';
import { generateTonalScale, hexToOklch, importDtcgTokens, oklchToCss } from './color-engine';
import { createFormaDtcgDocument } from './dtcg';

describe('design tokens', () => {
  const sample = { color: { primary: '#123456' }, spacing: { small: '4px' } };
  it('flattens nested values', () => { expect(flattenTokens(sample)).toEqual({ 'color-primary': '#123456', 'spacing-small': '4px' }); });
  it('emits CSS custom properties', () => { expect(toCssVariables(sample)).toContain('--forma-color-primary: #123456;'); });
  it('emits DTCG-like token objects', () => { expect(toDTCG(sample)).toHaveProperty('color.primary.$value', '#123456'); });
  it('contains semantic palettes', () => { expect(primitiveColors.gray.length).toBeGreaterThan(8); expect(semanticColors.light.text).toBe('#0f172a'); });
  it('converts hex to OKLCH and generates a 50..950 tonal scale', () => {
    expect(hexToOklch('#000000')).toEqual({ l: 0, c: 0, h: 0 });
    expect(hexToOklch('#ffffff')).toEqual({ l: 1, c: 0, h: 0 });
    const blue = hexToOklch('#1d4ed8');
    expect(blue.l).toBeGreaterThan(0.45);
    expect(blue.h).toBeGreaterThan(260);
    expect(oklchToCss({ l: 0.58, c: 0.19, h: 255, a: 0.5 })).toBe('oklch(0.58 0.19 255 / 0.5)');
    const scale = generateTonalScale('#1d4ed8');
    expect(scale[50]).toMatch(/^oklch\(/);
    expect(scale[950]).toMatch(/^oklch\(/);
  });
  it('imports W3C DTCG token trees into flat CSS variable maps', () => {
    const vars = importDtcgTokens(createFormaDtcgDocument());
    expect(vars['--forma-color-light-surface']).toBe('#ffffff');
    expect(vars['--forma-spacing-4']).toBe('1rem');
    expect(vars['--forma-motion-duration-fast']).toBe('120ms');
  });
});
