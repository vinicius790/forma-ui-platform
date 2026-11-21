import { describe, it, expect } from 'vitest';
import {
  defaultTokens,
  tokensToCssVariables,
  cssVar,
  toW3CTokens
} from './index.js';

describe('@forma-ui/tokens', () => {
  it('exposes complete semantic and scale design tokens', () => {
    expect(defaultTokens.colors.accentPrimary).toBe('#4f46e5');
    expect(defaultTokens.spacing[4]).toBe('1rem');
    expect(defaultTokens.typography.fontSize.md).toBe('1rem');
    expect(defaultTokens.radii.md).toBe('0.5rem');
    expect(defaultTokens.zIndex.modal).toBeGreaterThan(defaultTokens.zIndex.overlay);
  });

  it('converts tokens to CSS Custom Properties with custom or default prefix', () => {
    const vars = tokensToCssVariables(defaultTokens);
    expect(vars['--forma-color-accent-primary']).toBe('#4f46e5');
    expect(vars['--forma-space-4']).toBe('1rem');
    expect(vars['--forma-z-modal']).toBe('1300');

    const customVars = tokensToCssVariables(
      { colors: { ...defaultTokens.colors, accentPrimary: '#111111' } },
      'acme'
    );
    expect(customVars['--acme-color-accent-primary']).toBe('#111111');
  });

  it('generates valid cssVar() references with optional fallbacks', () => {
    expect(cssVar('color-fg-primary')).toBe('var(--forma-color-fg-primary)');
    expect(cssVar('color-fg-primary', '#000')).toBe('var(--forma-color-fg-primary, #000)');
  });

  it('exports W3C Design Tokens Community Group format', () => {
    const w3c = toW3CTokens();
    expect(w3c.$schema).toBe('https://tr.designtokens.org/format/');
    expect((w3c.color as Record<string, { $type: string }>).accentPrimary?.$type).toBe('color');
  });
});
