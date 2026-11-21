import {
  colorScale,
  defaultTokens,
  tokensToCssVariables,
  cssVar,
  type DesignTokenSet,
  type SemanticColorTokens
} from '@forma-ui/tokens';

export interface FormaTheme {
  name: string;
  colorScheme: 'light' | 'dark';
  tokens: DesignTokenSet;
}

export function createTheme(
  name: string,
  overrides: {
    colorScheme?: 'light' | 'dark';
    colors?: Partial<SemanticColorTokens>;
  } = {}
): FormaTheme {
  return {
    name,
    colorScheme: overrides.colorScheme ?? 'light',
    tokens: {
      ...defaultTokens,
      colors: {
        ...defaultTokens.colors,
        ...overrides.colors
      }
    }
  };
}

export const lightTheme: FormaTheme = createTheme('light', {
  colorScheme: 'light'
});

export const darkTheme: FormaTheme = createTheme('dark', {
  colorScheme: 'dark',
  colors: {
    bgCanvas: colorScale.neutral[950],
    bgSurface: colorScale.neutral[900],
    bgSurfaceSubtle: colorScale.neutral[800],
    bgSurfaceHover: colorScale.neutral[700],
    bgOverlay: 'rgba(0, 0, 0, 0.72)',
    fgPrimary: colorScale.neutral[50],
    fgSecondary: colorScale.neutral[300],
    fgMuted: colorScale.neutral[400],
    fgInverse: colorScale.neutral[950],
    borderDefault: colorScale.neutral[800],
    borderStrong: colorScale.neutral[600],
    accentPrimary: colorScale.brand[400],
    accentPrimaryHover: colorScale.brand[300],
    accentSubtle: 'rgba(99, 102, 241, 0.16)',
    focusRing: colorScale.brand[400]
  }
});

export const highContrastTheme: FormaTheme = createTheme('high-contrast', {
  colorScheme: 'light',
  colors: {
    bgCanvas: '#ffffff',
    bgSurface: '#ffffff',
    bgSurfaceSubtle: '#f3f4f6',
    bgSurfaceHover: '#e5e7eb',
    bgOverlay: 'rgba(0, 0, 0, 0.85)',
    fgPrimary: '#000000',
    fgSecondary: '#111827',
    fgMuted: '#1f2937',
    fgInverse: '#ffffff',
    borderDefault: '#000000',
    borderStrong: '#000000',
    accentPrimary: '#0000cc',
    accentPrimaryHover: '#000099',
    accentSubtle: '#e0e7ff',
    focusRing: '#000000',
    statusSuccess: '#005a2b',
    statusWarning: '#7a4100',
    statusDanger: '#a80000',
    statusInfo: '#003d99'
  }
});

export function applyTheme(
  theme: FormaTheme,
  target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): () => void {
  if (!target) return () => {};
  const cssVars = tokensToCssVariables(theme.tokens);
  const previousValues = new Map<string, string>();

  for (const [prop, val] of Object.entries(cssVars)) {
    previousValues.set(prop, target.style.getPropertyValue(prop));
    target.style.setProperty(prop, val);
  }
  const prevThemeAttr = target.getAttribute('data-forma-theme');
  const prevColorScheme = target.style.colorScheme;
  target.setAttribute('data-forma-theme', theme.name);
  target.style.colorScheme = theme.colorScheme;

  return () => {
    for (const [prop, prevVal] of previousValues.entries()) {
      if (prevVal) target.style.setProperty(prop, prevVal);
      else target.style.removeProperty(prop);
    }
    if (prevThemeAttr) target.setAttribute('data-forma-theme', prevThemeAttr);
    else target.removeAttribute('data-forma-theme');
    target.style.colorScheme = prevColorScheme;
  };
}

export function themeToCssBlock(theme: FormaTheme, selector = ':root'): string {
  const vars = tokensToCssVariables(theme.tokens);
  const declarations = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${selector} {\n  color-scheme: ${theme.colorScheme};\n${declarations}\n}`;
}

export function generateBaseComponentCss(): string {
  return `
/* Optional @forma-ui/themes stylesheet — targets semantic data-forma-* attributes without imposing classes */
[data-forma-button] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${cssVar('space-2')};
  padding: ${cssVar('space-2')} ${cssVar('space-4')};
  border-radius: ${cssVar('radius-md')};
  border: 1px solid ${cssVar('color-border-default')};
  background: ${cssVar('color-bg-surface')};
  color: ${cssVar('color-fg-primary')};
  font-family: ${cssVar('font-family-sans')};
  font-size: ${cssVar('font-size-sm')};
  font-weight: ${cssVar('font-weight-medium')};
  cursor: pointer;
  transition: background ${cssVar('motion-duration-fast')} ${cssVar('motion-easing-standard')};
}
[data-forma-button]:hover:not([data-disabled]) {
  background: ${cssVar('color-bg-surface-hover')};
}
[data-forma-button]:focus-visible {
  outline: 2px solid ${cssVar('color-focus-ring')};
  outline-offset: 2px;
}
[data-forma-button][data-disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}
[data-forma-dialog-overlay] {
  position: fixed;
  inset: 0;
  background: ${cssVar('color-bg-overlay')};
  z-index: ${cssVar('z-overlay')};
}
[data-forma-dialog-content] {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
  background: ${cssVar('color-bg-canvas')};
  color: ${cssVar('color-fg-primary')};
  border: 1px solid ${cssVar('color-border-default')};
  border-radius: ${cssVar('radius-lg')};
  padding: ${cssVar('space-6')};
  box-shadow: ${cssVar('shadow-overlay')};
  z-index: ${cssVar('z-modal')};
  max-inline-size: min(92vw, 32rem);
}
[data-forma-menu], [data-forma-select-listbox] {
  background: ${cssVar('color-bg-canvas')};
  border: 1px solid ${cssVar('color-border-default')};
  border-radius: ${cssVar('radius-md')};
  padding: ${cssVar('space-1')};
  box-shadow: ${cssVar('shadow-md')};
  z-index: ${cssVar('z-dropdown')};
}
[data-forma-menu-item][data-highlighted],
[data-forma-select-option][data-highlighted] {
  background: ${cssVar('color-accent-subtle')};
  color: ${cssVar('color-accent-primary')};
}
[data-forma-tab][aria-selected="true"] {
  border-block-end: 2px solid ${cssVar('color-accent-primary')};
  color: ${cssVar('color-accent-primary')};
}
[data-forma-tooltip] {
  background: ${cssVar('color-fg-primary')};
  color: ${cssVar('color-fg-inverse')};
  padding: ${cssVar('space-1-5')} ${cssVar('space-2-5')};
  border-radius: ${cssVar('radius-sm')};
  font-size: ${cssVar('font-size-xs')};
  z-index: ${cssVar('z-tooltip')};
}
[data-forma-toast] {
  background: ${cssVar('color-bg-canvas')};
  color: ${cssVar('color-fg-primary')};
  border: 1px solid ${cssVar('color-border-default')};
  border-radius: ${cssVar('radius-md')};
  padding: ${cssVar('space-3')} ${cssVar('space-4')};
  box-shadow: ${cssVar('shadow-lg')};
}
[data-forma-accordion-trigger] {
  inline-size: 100%;
  text-align: start;
  padding: ${cssVar('space-3')} ${cssVar('space-4')};
  background: transparent;
  border: 0;
  border-block-end: 1px solid ${cssVar('color-border-default')};
  color: ${cssVar('color-fg-primary')};
  cursor: pointer;
}
`.trim();
}

export function generateCompleteThemeCss(): string {
  return [
    themeToCssBlock(lightTheme, ':root, [data-forma-theme="light"]'),
    themeToCssBlock(darkTheme, '[data-forma-theme="dark"]'),
    themeToCssBlock(highContrastTheme, '[data-forma-theme="high-contrast"]'),
    generateBaseComponentCss()
  ].join('\n\n') + '\n';
}
