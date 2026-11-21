/**
 * Forma UI 50.0.0 perceptual OKLCH color engine and W3C DTCG token importer.
 * Implements exact Björn Ottosson sRGB -> linear sRGB -> LMS -> OKLab -> OKLCH math.
 */

export interface OklchColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly a?: number;
}

export type TonalScaleStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type TonalScale = Record<TonalScaleStep, string>;

function parseHexToSrgb(hex: string): readonly [number, number, number] {
  const clean = hex.trim().replace(/^#/u, '');
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/u.test(full)) {
    throw new RangeError(`Expected a #RGB or #RRGGBB hex color, received: ${hex}`);
  }
  return [
    Number.parseInt(full.slice(0, 2), 16) / 255,
    Number.parseInt(full.slice(2, 4), 16) / 255,
    Number.parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Converts a CSS hex color (`#RGB` or `#RRGGBB`) to perceptual OKLCH coordinates
 * using sRGB -> linear RGB -> LMS -> cube-root LMS -> OKLab -> OKLCH.
 */
export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const [sr, sg, sb] = parseHexToSrgb(hex);
  const lr = srgbToLinear(sr);
  const lg = srgbToLinear(sg);
  const lb = srgbToLinear(sb);

  const lLinear = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const mLinear = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const sLinear = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lc = Math.cbrt(lLinear);
  const mc = Math.cbrt(mLinear);
  const sc = Math.cbrt(sLinear);

  const labL = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  const labA = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  const labB = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;

  const rawC = Math.sqrt(labA * labA + labB * labB);
  const c = rawC < 1e-6 ? 0 : rawC;
  let h = c === 0 ? 0 : (Math.atan2(labB, labA) * 180) / Math.PI;
  if (h < 0) h += 360;

  return {
    l: Math.min(1, Math.max(0, roundTo(labL, 4))),
    c: Math.max(0, roundTo(c, 4)),
    h: c === 0 ? 0 : roundTo(h % 360, 2),
  };
}

/** Formats OKLCH coordinates as a CSS Color 4 `oklch(...)` string. */
export function oklchToCss({ l, c, h, a }: OklchColor): string {
  const clampedL = Math.min(1, Math.max(0, roundTo(l, 4)));
  const clampedC = Math.max(0, roundTo(c, 4));
  const normalizedH = roundTo(((h % 360) + 360) % 360, 2);
  if (a !== undefined) {
    const clampedA = Math.min(1, Math.max(0, roundTo(a, 4)));
    return `oklch(${clampedL} ${clampedC} ${normalizedH} / ${clampedA})`;
  }
  return `oklch(${clampedL} ${clampedC} ${normalizedH})`;
}

const TONAL_STOPS: ReadonlyArray<readonly [TonalScaleStep, number, number]> = [
  [50, 0.97, 0.14],
  [100, 0.93, 0.28],
  [200, 0.86, 0.50],
  [300, 0.77, 0.72],
  [400, 0.67, 0.90],
  [500, 0.58, 1.00],
  [600, 0.50, 0.96],
  [700, 0.43, 0.86],
  [800, 0.35, 0.72],
  [900, 0.27, 0.56],
  [950, 0.19, 0.40],
];

/** Generates a perceptually uniform 50..950 OKLCH tonal ramp from a seed hex color. */
export function generateTonalScale(seedHex: string): TonalScale {
  const seed = hexToOklch(seedHex);
  const result = {} as TonalScale;
  for (const [step, lightness, chromaFactor] of TONAL_STOPS) {
    const chroma = Math.min(0.37, seed.c * chromaFactor);
    result[step] = oklchToCss({ l: lightness, c: chroma, h: seed.h });
  }
  return result;
}

function toCssVarSegment(segment: string): string {
  return segment
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .replace(/[^a-zA-Z0-9_-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .toLowerCase();
}

function formatDtcgValue(value: unknown, tokenType: string | undefined, safePrefix: string): string {
  if (typeof value === 'string') {
    const aliasMatch = value.trim().match(/^\{([^{}]+)\}$/u);
    if (aliasMatch) {
      const refSegments = aliasMatch[1]!.split('.').map(toCssVarSegment).filter(Boolean);
      return `var(--${safePrefix}-${refSegments.join('-')})`;
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (tokenType === 'cubicBezier' && value.length === 4) {
      return `cubic-bezier(${value.join(', ')})`;
    }
    if (tokenType === 'fontFamily') {
      return value
        .map((item) => {
          const text = String(item);
          return /\s/u.test(text) ? `"${text}"` : text;
        })
        .join(', ');
    }
    return value.map((item) => formatDtcgValue(item, undefined, safePrefix)).join(', ');
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj['hex'] === 'string') {
      return obj['hex'];
    }
    if (typeof obj['value'] === 'number' && typeof obj['unit'] === 'string') {
      return `${obj['value']}${obj['unit']}`;
    }
    if (Array.isArray(obj['components']) && typeof obj['colorSpace'] === 'string') {
      const comps = (obj['components'] as unknown[]).map(String).join(' ');
      const alpha = typeof obj['alpha'] === 'number' && obj['alpha'] < 1 ? ` / ${obj['alpha']}` : '';
      return `color(${obj['colorSpace']} ${comps}${alpha})`;
    }
    if (
      tokenType === 'shadow' ||
      (Object.hasOwn(obj, 'offsetX') && Object.hasOwn(obj, 'offsetY') && Object.hasOwn(obj, 'blur'))
    ) {
      const ox = formatDtcgValue(obj['offsetX'] ?? '0px', 'dimension', safePrefix);
      const oy = formatDtcgValue(obj['offsetY'] ?? '0px', 'dimension', safePrefix);
      const blur = formatDtcgValue(obj['blur'] ?? '0px', 'dimension', safePrefix);
      const spread = obj['spread'] !== undefined ? ` ${formatDtcgValue(obj['spread'], 'dimension', safePrefix)}` : '';
      const color = formatDtcgValue(obj['color'] ?? '#000000', 'color', safePrefix);
      const inset = obj['inset'] === true ? 'inset ' : '';
      return `${inset}${ox} ${oy} ${blur}${spread} ${color}`;
    }
  }
  return String(value);
}

/**
 * Parses a W3C Design Tokens Community Group (DTCG) `$value`/`$type` token tree
 * into a flat map of CSS custom property names to serialized CSS values.
 */
export function importDtcgTokens(
  doc: Record<string, unknown>,
  prefix = 'forma',
): Record<string, string> {
  const safePrefix = toCssVarSegment(prefix) || 'forma';
  const variables: Record<string, string> = {};

  const visit = (node: unknown, path: readonly string[], inheritedType?: string): void => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const record = node as Record<string, unknown>;
    const localType = typeof record['$type'] === 'string' ? (record['$type'] as string) : inheritedType;

    if (Object.hasOwn(record, '$value')) {
      const varName = `--${[safePrefix, ...path.map(toCssVarSegment)].filter(Boolean).join('-')}`;
      variables[varName] = formatDtcgValue(record['$value'], localType, safePrefix);
      return;
    }

    for (const [key, child] of Object.entries(record)) {
      if (key.startsWith('$')) continue;
      visit(child, [...path, key], localType);
    }
  };

  visit(doc, []);
  return variables;
}
