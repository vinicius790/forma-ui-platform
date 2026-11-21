import { describe, expect, it, beforeEach } from 'vitest';
import { applyTheme, createCustomTheme, themes, themeCss, typedPropertiesCss } from './index';

describe('theme application', () => {
  beforeEach(() => { document.documentElement.removeAttribute('data-forma-theme'); document.documentElement.style.cssText = ''; });
  it('applies and restores properties', () => { document.documentElement.style.setProperty('--forma-color-text', 'purple'); const cleanup = applyTheme('dark'); expect(document.documentElement.style.getPropertyValue('--forma-color-text')).toBe(themes.dark['--forma-color-text']); cleanup(); expect(document.documentElement.style.getPropertyValue('--forma-color-text')).toBe('purple'); });
  it('generates optional CSS', () => { expect(themeCss('high-contrast')).toContain('--forma-color-focus: #ffff00;'); });
  it('builds custom OKLCH themes and Houdini @property declarations', () => {
    const brand = createCustomTheme('Acme', { brandHex: '#1d4ed8', mode: 'light' });
    expect(brand.name).toBe('acme');
    expect(brand.tokens['--forma-color-primary-foreground']).toBe('#ffffff');
    expect(brand.tokens['--forma-color-brand-500']).toMatch(/^oklch\(/);
    expect(typedPropertiesCss()).toContain("@property --forma-color-primary");
    expect(typedPropertiesCss()).toContain("syntax: '<color>';");
  });
});
