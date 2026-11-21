import { semanticColorsLight, type SemanticColorTokens } from './colors.js';
import { spacingTokens } from './spacing.js';
import { typographyTokens } from './typography.js';
import { radiiTokens, shadowTokens, zIndexTokens, motionTokens } from './elevation.js';

export interface DesignTokenSet {
  colors: SemanticColorTokens;
  spacing: typeof spacingTokens;
  typography: typeof typographyTokens;
  radii: typeof radiiTokens;
  shadows: typeof shadowTokens;
  zIndex: typeof zIndexTokens;
  motion: typeof motionTokens;
}

export const defaultTokens: DesignTokenSet = {
  colors: semanticColorsLight,
  spacing: spacingTokens,
  typography: typographyTokens,
  radii: radiiTokens,
  shadows: shadowTokens,
  zIndex: zIndexTokens,
  motion: motionTokens
};

function toKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\./g, '-')
    .toLowerCase();
}

export function tokensToCssVariables(
  tokens: Partial<DesignTokenSet> = defaultTokens,
  prefix = 'forma'
): Record<string, string> {
  const vars: Record<string, string> = {};
  const merged: DesignTokenSet = {
    colors: { ...defaultTokens.colors, ...tokens.colors },
    spacing: { ...defaultTokens.spacing, ...tokens.spacing },
    typography: { ...defaultTokens.typography, ...tokens.typography },
    radii: { ...defaultTokens.radii, ...tokens.radii },
    shadows: { ...defaultTokens.shadows, ...tokens.shadows },
    zIndex: { ...defaultTokens.zIndex, ...tokens.zIndex },
    motion: { ...defaultTokens.motion, ...tokens.motion }
  };

  for (const [key, val] of Object.entries(merged.colors)) {
    vars[`--${prefix}-color-${toKebabCase(key)}`] = val;
  }
  for (const [key, val] of Object.entries(merged.spacing)) {
    vars[`--${prefix}-space-${toKebabCase(key)}`] = val;
  }
  for (const [group, entries] of Object.entries(merged.typography)) {
    for (const [key, val] of Object.entries(entries)) {
      vars[`--${prefix}-${toKebabCase(group)}-${toKebabCase(key)}`] = val;
    }
  }
  for (const [key, val] of Object.entries(merged.radii)) {
    vars[`--${prefix}-radius-${toKebabCase(key)}`] = val;
  }
  for (const [key, val] of Object.entries(merged.shadows)) {
    vars[`--${prefix}-shadow-${toKebabCase(key)}`] = val;
  }
  for (const [key, val] of Object.entries(merged.zIndex)) {
    vars[`--${prefix}-z-${toKebabCase(key)}`] = String(val);
  }
  for (const [group, entries] of Object.entries(merged.motion)) {
    for (const [key, val] of Object.entries(entries)) {
      vars[`--${prefix}-motion-${toKebabCase(group)}-${toKebabCase(key)}`] = val;
    }
  }

  return vars;
}

export function cssVar(name: string, fallback?: string, prefix = 'forma'): string {
  const varName = name.startsWith('--') ? name : `--${prefix}-${name}`;
  return fallback ? `var(${varName}, ${fallback})` : `var(${varName})`;
}

export function toW3CTokens(tokens: DesignTokenSet = defaultTokens): Record<string, unknown> {
  const wrap = (record: Record<string, string | number>, $type: string) =>
    Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k, { $value: v, $type }])
    );

  return {
    $schema: 'https://tr.designtokens.org/format/',
    color: wrap(tokens.colors as unknown as Record<string, string>, 'color'),
    spacing: wrap(tokens.spacing as unknown as Record<string, string>, 'dimension'),
    radius: wrap(tokens.radii as unknown as Record<string, string>, 'dimension'),
    shadow: wrap(tokens.shadows as unknown as Record<string, string>, 'shadow'),
    zIndex: wrap(tokens.zIndex as unknown as Record<string, number>, 'number'),
    typography: {
      fontFamily: wrap(tokens.typography.fontFamily, 'fontFamily'),
      fontSize: wrap(tokens.typography.fontSize, 'dimension'),
      fontWeight: wrap(tokens.typography.fontWeight, 'fontWeight'),
      lineHeight: wrap(tokens.typography.lineHeight, 'number'),
      letterSpacing: wrap(tokens.typography.letterSpacing, 'dimension')
    }
  };
}
