/**
 * Forma UI 50.0.0 custom theme builder and CSS Houdini `@property` declarations.
 * Kept zero-dependency with inline OKLCH and APCA contrast math so `@forma-ui/themes`
 * preserves an acyclic, standalone workspace graph.
 */

const BASE_THEME_DEFAULTS: Record<'light' | 'dark', Readonly<Record<string, string>>> = {
  light: {
    '--forma-color-surface': '#ffffff',
    '--forma-color-text': '#0f172a',
    '--forma-color-muted': '#475569',
    '--forma-color-border': '#cbd5e1',
    '--forma-color-focus': '#1d4ed8',
    '--forma-color-primary': '#1d4ed8',
    '--forma-color-danger': '#b91c1c',
    '--forma-radius-control': '0.375rem',
    '--forma-shadow-overlay': '0 12px 32px rgb(15 23 42 / 0.18)',
  },
  dark: {
    '--forma-color-surface': '#0f172a',
    '--forma-color-text': '#f8fafc',
    '--forma-color-muted': '#cbd5e1',
    '--forma-color-border': '#64748b',
    '--forma-color-focus': '#93c5fd',
    '--forma-color-primary': '#93c5fd',
    '--forma-color-danger': '#fca5a5',
    '--forma-radius-control': '0.375rem',
    '--forma-shadow-overlay': '0 12px 32px rgb(0 0 0 / 0.5)',
  },
};

export interface CustomThemeOptions {
  brandHex: string;
  mode?: 'light' | 'dark';
}

export interface CustomThemeDefinition {
  readonly name: string;
  readonly mode: 'light' | 'dark';
  readonly tokens: Readonly<Record<string, string>>;
  readonly css: string;
}

function parseHexRgb(hex: string): readonly [number, number, number] {
  const clean = hex.trim().replace(/^#/u, '');
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/u.test(full)) {
    throw new RangeError(`Expected a #RGB or #RRGGBB hex color, received: ${hex}`);
  }
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function srgbToLinear(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function hexToOklchInline(hex: string): { l: number; c: number; h: number } {
  const [r, g, b] = parseHexRgb(hex);
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

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
    l: Math.min(1, Math.max(0, Math.round(labL * 10000) / 10000)),
    c: Math.max(0, Math.round(c * 10000) / 10000),
    h: c === 0 ? 0 : Math.round((h % 360) * 100) / 100,
  };
}

function formatOklch(l: number, c: number, h: number): string {
  const rl = Math.min(1, Math.max(0, Math.round(l * 10000) / 10000));
  const rc = Math.max(0, Math.round(c * 10000) / 10000);
  const rh = Math.round((((h % 360) + 360) % 360) * 100) / 100;
  return `oklch(${rl} ${rc} ${rh})`;
}

function apcaLuminanceInline(hex: string): number {
  const [r, g, b] = parseHexRgb(hex);
  const y =
    0.2126729 * Math.pow(r / 255, 2.4) +
    0.7151522 * Math.pow(g / 255, 2.4) +
    0.072175 * Math.pow(b / 255, 2.4);
  return y > 0.022 ? y : y + Math.pow(0.022 - y, 1.414);
}

function pickAccessibleForegroundInline(backgroundHex: string): string {
  const bgY = apcaLuminanceInline(backgroundHex);
  const candidates = ['#0f172a', '#ffffff'] as const;
  let best: string = candidates[0];
  let bestAbs = -1;
  for (const candidate of candidates) {
    const txtY = apcaLuminanceInline(candidate);
    const sapc =
      bgY > txtY
        ? (Math.pow(bgY, 0.56) - Math.pow(txtY, 0.57)) * 1.14
        : (Math.pow(bgY, 0.65) - Math.pow(txtY, 0.62)) * 1.14;
    const score = Math.abs(sapc);
    if (score > bestAbs) {
      bestAbs = score;
      best = candidate;
    }
  }
  return best;
}

const BRAND_TONES: ReadonlyArray<readonly [number, number, number]> = [
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

/**
 * Generates an opt-in custom theme token map and CSS ruleset from a brand seed hex color.
 * Computes perceptual OKLCH tonal steps and selects a high-contrast foreground color.
 */
export function createCustomTheme(
  name: string,
  options: CustomThemeOptions,
): CustomThemeDefinition {
  const safeName = name.trim().replace(/[^a-zA-Z0-9_-]+/gu, '-').toLowerCase() || 'custom';
  const mode = options.mode ?? 'light';
  const oklch = hexToOklchInline(options.brandHex);
  const base = BASE_THEME_DEFAULTS[mode];
  const primary =
    mode === 'dark'
      ? formatOklch(Math.max(0.72, Math.min(0.84, oklch.l + 0.22)), Math.min(0.18, oklch.c), oklch.h)
      : formatOklch(Math.max(0.42, Math.min(0.56, oklch.l)), Math.min(0.24, oklch.c), oklch.h);
  const focus =
    mode === 'dark'
      ? formatOklch(0.78, Math.min(0.16, oklch.c), oklch.h)
      : formatOklch(0.50, Math.min(0.22, oklch.c), oklch.h);

  const tokens: Record<string, string> = {
    ...base,
    '--forma-color-primary': primary,
    '--forma-color-focus': focus,
    '--forma-color-primary-foreground': pickAccessibleForegroundInline(options.brandHex),
  };

  for (const [step, l, factor] of BRAND_TONES) {
    tokens[`--forma-color-brand-${step}`] = formatOklch(l, Math.min(0.37, oklch.c * factor), oklch.h);
  }

  const declarations = Object.entries(tokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  const css = `:root[data-forma-theme="${safeName}"] {\n  color-scheme: ${mode};\n${declarations}\n}`;

  return {
    name: safeName,
    mode,
    tokens: Object.freeze(tokens),
    css,
  };
}

/**
 * Generates CSS Houdini `@property` rules with `syntax: '<color>'` for `--forma-color-*` custom properties,
 * enabling smooth browser-interpolated color transitions across theme switches.
 */
export function typedPropertiesCss(): string {
  const colorEntries = Object.entries(BASE_THEME_DEFAULTS.light).filter(([key]) =>
    key.startsWith('--forma-color-'),
  );
  return colorEntries
    .map(
      ([property, initialValue]) =>
        `@property ${property} {\n  syntax: '<color>';\n  inherits: true;\n  initial-value: ${initialValue};\n}`,
    )
    .join('\n\n');
}
