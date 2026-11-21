export type ThemeName = 'light' | 'dark' | 'oled-dark' | 'high-contrast' | 'high-contrast-light';

export const themes: Record<ThemeName, Record<string, string>> = {
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
  'oled-dark': {
    '--forma-color-surface': '#000000',
    '--forma-color-text': '#f8fafc',
    '--forma-color-muted': '#94a3b8',
    '--forma-color-border': '#334155',
    '--forma-color-focus': '#60a5fa',
    '--forma-color-primary': '#60a5fa',
    '--forma-color-danger': '#f87171',
    '--forma-radius-control': '0.375rem',
    '--forma-shadow-overlay': '0 12px 32px rgb(0 0 0 / 0.85)',
  },
  'high-contrast': {
    '--forma-color-surface': '#000000',
    '--forma-color-text': '#ffffff',
    '--forma-color-muted': '#ffffff',
    '--forma-color-border': '#ffffff',
    '--forma-color-focus': '#ffff00',
    '--forma-color-primary': '#00ffff',
    '--forma-color-danger': '#ff8080',
    '--forma-radius-control': '0',
    '--forma-shadow-overlay': 'none',
  },
  'high-contrast-light': {
    '--forma-color-surface': '#ffffff',
    '--forma-color-text': '#000000',
    '--forma-color-muted': '#000000',
    '--forma-color-border': '#000000',
    '--forma-color-focus': '#0000cc',
    '--forma-color-primary': '#0000cc',
    '--forma-color-danger': '#990000',
    '--forma-radius-control': '0',
    '--forma-shadow-overlay': 'none',
  },
};

export function applyTheme(name: ThemeName, target?: HTMLElement): () => void {
  const element = target ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!element) return () => undefined;
  const previous = new Map<string, string>();
  for (const [key, value] of Object.entries(themes[name])) {
    previous.set(key, element.style.getPropertyValue(key));
    element.style.setProperty(key, value);
  }
  const oldTheme = element.dataset['formaTheme'];
  element.dataset['formaTheme'] = name;
  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
    for (const [key, value] of previous) {
      if (value) element.style.setProperty(key, value);
      else element.style.removeProperty(key);
    }
    if (oldTheme === undefined) delete element.dataset['formaTheme'];
    else element.dataset['formaTheme'] = oldTheme;
  };
}

export function themeCss(name: ThemeName): string {
  const colorScheme = name === 'light' || name === 'high-contrast-light' ? 'light' : 'dark';
  return `:root[data-forma-theme="${name}"] {\n  color-scheme: ${colorScheme};\n${Object.entries(themes[name]).map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}`;
}

export function forcedColorsCss(): string {
  return `@media (forced-colors: active) {\n  :root {\n    --forma-color-surface: Canvas;\n    --forma-color-text: CanvasText;\n    --forma-color-muted: GrayText;\n    --forma-color-border: ButtonBorder;\n    --forma-color-focus: Highlight;\n    --forma-color-primary: LinkText;\n    --forma-shadow-overlay: none;\n  }\n}`;
}

export function allThemesCss(options: { layered?: boolean } = {}): string {
  const body = `${(Object.keys(themes) as ThemeName[]).map(themeCss).join('\n\n')}\n\n${forcedColorsCss()}`;
  return options.layered ? `@layer forma.themes {\n${body}\n}` : body;
}

/** SSR-safe observer that resolves preferred system theme (`light | dark | high-contrast`). */
export function observeSystemTheme(
  onChange: (theme: ThemeName) => void,
  win?: Window,
): () => void {
  const target = win ?? (typeof window !== 'undefined' ? window : undefined);
  if (!target || typeof target.matchMedia !== 'function') return () => {};
  const darkMql = target.matchMedia('(prefers-color-scheme: dark)');
  const contrastMql = target.matchMedia('(prefers-contrast: more)');
  const resolve = (): ThemeName => {
    if (contrastMql.matches) return darkMql.matches ? 'high-contrast' : 'high-contrast-light';
    return darkMql.matches ? 'dark' : 'light';
  };
  let active = true;
  const notify = () => {
    if (active) onChange(resolve());
  };
  darkMql.addEventListener?.('change', notify);
  contrastMql.addEventListener?.('change', notify);
  notify();
  return () => {
    if (!active) return;
    active = false;
    darkMql.removeEventListener?.('change', notify);
    contrastMql.removeEventListener?.('change', notify);
  };
}

export * from './theme-builder';
