import { primitiveColors, semanticColors } from './colors';

export type DtcgColor = {
  colorSpace: 'srgb';
  components: [number, number, number];
  hex: string;
};
export interface DtcgToken<T = unknown> { $type: string; $value: T; $description?: string }
export interface DtcgGroup { $description?: string; $type?: string; [key: string]: unknown }
export interface FormaDtcgDocument {
  $description: string;
  color: DtcgGroup;
  spacing: DtcgGroup;
  radius: DtcgGroup;
  typography: DtcgGroup;
  motion: DtcgGroup;
  elevation: DtcgGroup;
}

export function hexToDtcgColor(hex: string): DtcgColor {
  const normalized = hex.trim().replace(/^#/u, '');
  if (!/^[\da-fA-F]{6}$/u.test(normalized)) throw new RangeError(`Expected a six-digit hex color, received: ${hex}`);
  const components = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255) as [number, number, number];
  return { colorSpace: 'srgb', components, hex: `#${normalized.toLowerCase()}` };
}

/** Emits tokens following the Design Tokens Community Group Format Module 2025.10. */
export function createFormaDtcgDocument(): FormaDtcgDocument {
  const color: DtcgGroup = { $description: 'Primitive color palettes and semantic themes.' };
  for (const [name, scale] of Object.entries(primitiveColors)) {
    color[name] = { $type: 'color', ...Object.fromEntries(scale.map((value, index) => [`${String(index + 50).padStart(3, '0')}`, { $value: hexToDtcgColor(value) }])) };
  }
  for (const [mode, values] of Object.entries(semanticColors)) {
    color[mode] = {
      $description: `${mode} semantic colors.`,
      $type: 'color',
      ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { $value: hexToDtcgColor(value) }])),
    };
  }
  return {
    $description: 'Forma UI design tokens. DTCG Format Module 2025.10.',
    color,
    spacing: {
      $description: 'Spacing scale in rem.',
      $type: 'dimension',
      ...Object.fromEntries([0, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24].map((value) => [String(value), { $value: { value: value * 0.25, unit: 'rem' } }])),
    },
    radius: {
      $description: 'Corner radii.',
      $type: 'dimension',
      none: { $value: { value: 0, unit: 'rem' } },
      sm: { $value: { value: 0.125, unit: 'rem' } },
      md: { $value: { value: 0.375, unit: 'rem' } },
      lg: { $value: { value: 0.75, unit: 'rem' } },
      full: { $value: { value: 999, unit: 'rem' } },
    },
    typography: {
      $description: 'Typography families, sizes and weights.',
      fontFamily: { $type: 'fontFamily', $value: ['Inter', 'system-ui', 'sans-serif'] },
      fontSize: { $type: 'dimension', ...Object.fromEntries([['sm', 0.875], ['md', 1], ['lg', 1.125], ['xl', 1.25], ['2xl', 1.5]].map(([name, value]) => [name, { $value: { value, unit: 'rem' } }])) },
      fontWeight: { $type: 'fontWeight', regular: { $value: 400 }, medium: { $value: 500 }, semibold: { $value: 600 }, bold: { $value: 700 } },
    },
    motion: {
      $description: 'Motion timing tokens. Components must honor prefers-reduced-motion.',
      duration: { $type: 'duration', fast: { $value: { value: 120, unit: 'ms' } }, normal: { $value: { value: 180, unit: 'ms' } }, slow: { $value: { value: 260, unit: 'ms' } } },
      easing: { $type: 'cubicBezier', standard: { $value: [0.2, 0, 0, 1] } },
    },
    elevation: {
      $description: 'Shadow levels.',
      shadow: { $type: 'shadow', low: { $value: { color: hexToDtcgColor('#0f172a'), offsetX: { value: 0, unit: 'px' }, offsetY: { value: 2, unit: 'px' }, blur: { value: 8, unit: 'px' }, spread: { value: 0, unit: 'px' } } }, high: { $value: { color: hexToDtcgColor('#0f172a'), offsetX: { value: 0, unit: 'px' }, offsetY: { value: 12, unit: 'px' }, blur: { value: 32, unit: 'px' }, spread: { value: 0, unit: 'px' } } } },
    },
  };
}

export interface DtcgValidationIssue { path: string; message: string }
export function validateDtcgDocument(value: unknown): DtcgValidationIssue[] {
  const issues: DtcgValidationIssue[] = [];
  const visit = (node: unknown, path: string, inheritedType?: string) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      issues.push({ path, message: 'A group or token must be an object.' });
      return;
    }
    const record = node as Record<string, unknown>;
    const isToken = Object.hasOwn(record, '$value');
    const localType = typeof record['$type'] === 'string' ? record['$type'] as string : inheritedType;
    if (isToken) {
      if (Object.keys(record).some((key) => key !== '$value' && key !== '$type' && key !== '$description' && key !== '$deprecated' && key !== '$extensions')) {
        issues.push({ path, message: 'A token cannot also contain child groups or tokens.' });
      }
      if (!localType) issues.push({ path, message: 'Token type is missing and cannot be inherited.' });
      return;
    }
    for (const [key, child] of Object.entries(record)) {
      if (key.startsWith('$')) continue;
      if (/[{}.]/u.test(key)) issues.push({ path: `${path}.${key}`, message: 'Token and group names cannot contain braces or periods.' });
      visit(child, path ? `${path}.${key}` : key, localType);
    }
  };
  if (!value || typeof value !== 'object') return [{ path: '', message: 'Document root must be an object.' }];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('$')) continue;
    visit(child, key);
  }
  return issues;
}
