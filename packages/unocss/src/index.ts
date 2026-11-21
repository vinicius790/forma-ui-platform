import type { Preset } from 'unocss';
import { semanticColors, oklchPalette } from '@forma-ui/tokens';

export interface FormaUnoOptions {
  prefix?: string;
  dark?: boolean;
}

export const stateVariantMatchers: ReadonlyArray<[string, string]> = [
  ['forma-open:', '[data-state="open"]'],
  ['forma-closed:', '[data-state="closed"]'],
  ['forma-checked:', '[data-state="checked"]'],
  ['forma-active:', '[data-active="true"]'],
  ['forma-highlighted:', '[data-highlighted="true"]'],
  ['forma-disabled:', '[data-disabled]'],
  ['forma-dragging:', '[data-dragging="true"]'],
  ['forma-grabbed:', '[data-grabbed="true"]'],
  ['forma-expanded:', ':is([aria-expanded="true"], [data-state="expanded"])'],
  ['forma-collapsed:', ':is([aria-expanded="false"], [data-state="collapsed"])'],
  ['forma-selected:', ':is([aria-selected="true"], [data-selected="true"])'],
  ['forma-invalid:', ':is([aria-invalid="true"], [data-invalid="true"])'],
  ['forma-loading:', ':is([aria-busy="true"], [data-loading="true"])'],
];

export function presetForma(options: FormaUnoOptions = {}): Preset {
  const prefix = options.prefix ?? 'forma-';
  const colors = semanticColors[options.dark ? 'dark' : 'light'];
  const vars: Record<string, string> = {
    surface: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    focus: colors.focus,
    danger: colors.danger,
    'brand-500': oklchPalette.brand[500],
  };
  return {
    name: '@forma-ui/unocss',
    theme: {
      colors: Object.fromEntries(Object.entries(vars).map(([key, value]) => [`forma-${key}`, value])),
    },
    rules: Object.entries(vars).map(([key, value]) => [`${prefix}${key}`, { [`--forma-${key}`]: value }]),
    variants: stateVariantMatchers.map(([trigger, attr]) => (matcher: string) => {
      if (!matcher.startsWith(trigger)) return matcher;
      return {
        matcher: matcher.slice(trigger.length),
        selector: (s: string) => `${s}${attr}`,
      };
    }),
  };
}
