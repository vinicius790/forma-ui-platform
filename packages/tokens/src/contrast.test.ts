import { describe, expect, it } from 'vitest';
import { contrastRatio, meetsWCAG, parseColor, relativeLuminance } from './contrast';

describe('contrast math', () => {
  it('parses short and full hex', () => { expect(parseColor('#fff')).toEqual([255,255,255]); expect(parseColor('#000000')).toEqual([0,0,0]); });
  it('uses WCAG relative luminance and ratio', () => { expect(relativeLuminance('#000')).toBe(0); expect(relativeLuminance('#fff')).toBe(1); expect(contrastRatio('#000', '#fff')).toBeCloseTo(21); });
  it('checks AA and AAA thresholds', () => { expect(meetsWCAG('#000', '#fff')).toBe(true); expect(meetsWCAG('#777', '#fff', 'AA')).toBe(false); expect(meetsWCAG('#777', '#fff', 'AAA')).toBe(false); });
  it('rejects out-of-range and translucent RGB channels', () => { expect(() => parseColor('rgb(300, 0, 0)')).toThrow(RangeError); expect(() => parseColor('rgba(0, 0, 0, 0.5)')).toThrow(RangeError); expect(() => relativeLuminance([0, -1, 0])).toThrow(RangeError); });
});
