export type RGB = readonly [number, number, number];
export function parseColor(input: string): RGB {
  const value = input.trim().toLowerCase();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) { const raw = hex[1]!; const expanded = raw.length === 3 ? [...raw].map((x) => x + x).join('') : raw; return [0, 2, 4].map((i) => Number.parseInt(expanded.slice(i, i + 2), 16)) as unknown as RGB; }
  const rgb = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d+(?:\.\d+)?%?))?\s*\)$/);
  if (rgb) {
    if (rgb[4] !== undefined) {
      const alpha = rgb[4].endsWith('%') ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4]);
      if (alpha !== 1) throw new RangeError('Alpha must equal 1 for a direct WCAG contrast calculation. Composite translucent colors against their actual background first.');
    }
    const channels = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as const;
    if (channels.some((channel) => !Number.isFinite(channel) || channel < 0 || channel > 255)) {
      throw new RangeError(`RGB channels must be between 0 and 255: ${input}`);
    }
    return channels;
  }
  throw new TypeError(`Unsupported color format: ${input}. Use #RGB, #RRGGBB or rgb().`);
}
export function channelLuminance(channel: number): number { const s = channel / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }
export function relativeLuminance(color: string | RGB): number {
  const [r, g, b] = typeof color === 'string' ? parseColor(color) : color;
  if ([r, g, b].some((channel) => !Number.isFinite(channel) || channel < 0 || channel > 255)) {
    throw new RangeError('RGB channels must be finite values between 0 and 255.');
  }
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}
export function contrastRatio(foreground: string, background: string): number { const a = relativeLuminance(foreground); const b = relativeLuminance(background); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
export function meetsWCAG(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA', largeText = false): boolean { const ratio = contrastRatio(foreground, background); return ratio >= (level === 'AAA' ? (largeText ? 4.5 : 7) : (largeText ? 3 : 4.5)); }
