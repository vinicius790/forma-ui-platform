import { describe, expect, it } from 'vitest';
import { createFormaDtcgDocument, hexToDtcgColor, validateDtcgDocument } from './dtcg';

describe('DTCG 2025.10 token export', () => {
  it('converts strict six digit hexadecimal colors to sRGB components', () => {
    expect(hexToDtcgColor('#ff0000')).toEqual({ colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' });
    expect(() => hexToDtcgColor('#fff')).toThrow(RangeError);
  });
  it('emits valid typed groups for colors, dimensions, durations and shadows', () => {
    const document = createFormaDtcgDocument();
    expect(validateDtcgDocument(document)).toEqual([]);
    const lightColors = document.color['light'] as Record<string, unknown>;
    expect(lightColors['primary']).toEqual({ $value: { colorSpace: 'srgb', components: [29 / 255, 78 / 255, 216 / 255], hex: '#1d4ed8' } });
  });
  it('rejects mixed groups and untyped tokens', () => {
    const issues = validateDtcgDocument({ group: { token: { $value: 'x', child: {} }, other: { $value: 'y' } } });
    expect(issues.length).toBeGreaterThan(0);
  });
});
