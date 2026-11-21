import { semanticColors, oklchPalette, containerBreakpoints } from '@forma-ui/tokens';

export interface FormaTailwindTheme {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
}

export function createFormaTailwindTheme(mode: 'light' | 'dark' = 'light'): FormaTailwindTheme {
  const colors = semanticColors[mode];
  return {
    colors: {
      surface: colors.surface,
      'surface-raised': colors.surfaceRaised,
      text: colors.text,
      'text-muted': colors.textMuted,
      border: colors.border,
      focus: colors.focus,
      primary: colors.primary,
      danger: colors.danger,
      success: colors.success,
      warning: colors.warning,
    },
    spacing: {
      '0.5': '0.125rem',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '6': '1.5rem',
      '8': '2rem',
      '12': '3rem',
    },
    radius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
  };
}

export const formaTailwindContent = {
  themeVariables:
    '--color-surface --color-surface-raised --color-text --color-text-muted --color-border --color-focus --color-primary --color-danger --color-success --color-warning',
} as const;

export const formaStateVariants = Object.freeze({
  'forma-open': '&[data-state="open"]',
  'forma-closed': '&[data-state="closed"]',
  'forma-checked': '&[data-state="checked"]',
  'forma-unchecked': '&[data-state="unchecked"]',
  'forma-active': '&[data-active="true"], &[data-state="active"]',
  'forma-highlighted': '&[data-highlighted="true"]',
  'forma-disabled': '&[data-disabled], &[aria-disabled="true"]',
  'forma-dragging': '&[data-dragging="true"]',
  'forma-grabbed': '&[data-grabbed="true"]',
  'forma-horizontal': '&[data-orientation="horizontal"]',
  'forma-vertical': '&[data-orientation="vertical"]',
  'forma-expanded': '&[aria-expanded="true"], &[data-state="expanded"]',
  'forma-collapsed': '&[aria-expanded="false"], &[data-state="collapsed"]',
  'forma-selected': '&[aria-selected="true"], &[data-selected="true"]',
  'forma-invalid': '&[aria-invalid="true"], &[data-invalid="true"]',
  'forma-loading': '&[aria-busy="true"], &[data-loading="true"]',
});

/** Generates a complete Tailwind CSS v4 `@theme` + `@custom-variant` CSS layer using Forma UI OKLCH & semantic tokens. */
export function createFormaTailwindV4Css(mode: 'light' | 'dark' = 'light'): string {
  const theme = createFormaTailwindTheme(mode);
  const colorLines = Object.entries(theme.colors).map(([k, v]) => `  --color-forma-${k}: ${v};`);
  const oklchLines = Object.entries(oklchPalette.brand).map(([k, v]) => `  --color-forma-brand-${k}: ${v};`);
  const containerLines = Object.entries(containerBreakpoints).map(([k, v]) => `  --container-forma-${k}: ${v};`);
  const variantLines = Object.entries(formaStateVariants).map(([name, selector]) => `@custom-variant ${name} (${selector});`);
  return `@theme {\n${[...colorLines, ...oklchLines, ...containerLines].join('\n')}\n}\n\n${variantLines.join('\n')}\n`;
}
