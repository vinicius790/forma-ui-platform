import { describe, it, expect, beforeEach } from 'vitest';
import {
  lightTheme,
  darkTheme,
  highContrastTheme,
  createTheme,
  applyTheme,
  generateCompleteThemeCss
} from './index.js';

describe('@forma-ui/themes', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-forma-theme');
  });

  it('applies and cleans up CSS custom properties dynamically on target element', () => {
    const cleanup = applyTheme(darkTheme, document.documentElement);
    expect(document.documentElement.getAttribute('data-forma-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--forma-color-bg-canvas')).toBe(
      darkTheme.tokens.colors.bgCanvas
    );

    cleanup();
    expect(document.documentElement.getAttribute('data-forma-theme')).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--forma-color-bg-canvas')).toBe('');
  });

  it('supports creating custom themes and generating complete CSS stylesheet', () => {
    const custom = createTheme('brand-ocean', {
      colors: { accentPrimary: '#0284c7' }
    });
    expect(custom.tokens.colors.accentPrimary).toBe('#0284c7');
    expect(lightTheme.colorScheme).toBe('light');
    expect(highContrastTheme.tokens.colors.fgPrimary).toBe('#000000');

    const css = generateCompleteThemeCss();
    expect(css).toContain('[data-forma-theme="dark"]');
    expect(css).toContain('[data-forma-button]');
  });
});
