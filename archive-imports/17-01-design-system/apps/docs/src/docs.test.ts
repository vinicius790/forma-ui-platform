import { describe, it, expect, beforeEach } from 'vitest';
import { initDocsApp } from './main.js';
import { computeThemeContrastPairs } from './token-visualizer.js';
import { KEYBOARD_ACCESSIBILITY_MATRIX } from './keyboard-matrix.js';

describe('@forma-ui/docs interactive playground & live documentation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="theme-switcher">
        <option value="unstyled">Unstyled</option>
        <option value="light" selected>Light</option>
        <option value="dark">Dark</option>
        <option value="high-contrast">High Contrast</option>
      </select>
      <select id="locale-switcher">
        <option value="pt-BR" selected>pt-BR</option>
        <option value="en-US">en-US</option>
        <option value="ar-SA">ar-SA</option>
      </select>
      <button id="run-a11y-audit" type="button">Audit</button>
      <main id="playground-root"></main>
      <aside id="a11y-inspector"></aside>
    `;
  });

  it('mounts all 8 interactive component demos + Token Visualizer + Keyboard Matrix and passes axe-core', async () => {
    const app = initDocsApp(document);

    // 8 component sections + 1 token visualizer section + 1 keyboard matrix section = 10 sections
    expect(document.querySelectorAll('#playground-root section').length).toBe(10);
    expect(document.documentElement.dir).toBe('ltr');

    // Verify WCAG contrast pairs calculation
    const contrastPairs = computeThemeContrastPairs();
    expect(contrastPairs.length).toBeGreaterThanOrEqual(5);
    expect(contrastPairs.every((p) => p.passesAA)).toBe(true);

    // Verify Keyboard Matrix completeness
    expect(KEYBOARD_ACCESSIBILITY_MATRIX.length).toBe(8);

    // Switch to Arabic (RTL)
    app.setLocale('ar-SA');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar-SA');

    // Switch across all themes including unstyled headless mode
    app.setTheme('dark');
    expect(document.documentElement.getAttribute('data-forma-theme')).toBe('dark');

    app.setTheme('high-contrast');
    expect(document.documentElement.getAttribute('data-forma-theme')).toBe('high-contrast');

    app.setTheme('unstyled');
    expect(document.getElementById('forma-optional-theme-css')).toBeNull();

    // Run full axe-core audit on the entire mounted playground
    const violations = await app.runAudit();
    expect(violations).toBe(0);

    app.destroy();
  });
});
