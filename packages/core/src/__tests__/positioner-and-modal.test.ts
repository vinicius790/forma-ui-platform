import { describe, expect, it } from 'vitest';
import { computePosition } from '../primitives/positioner';
import { ariaHideOutside } from '../primitives/aria-hide-outside';

describe('positioner and modal primitives', () => {
  it('flips and clamps floating content into the viewport', () => { const ref = new DOMRect(100, 5, 50, 20); const popup = new DOMRect(0, 0, 160, 100); const result = computePosition(ref, popup, { placement: 'top' }); expect(result.placement).toBe('bottom'); expect(result.x).toBeGreaterThanOrEqual(8); });
  it('hides external siblings from the accessibility tree and restores state', () => { const app = document.createElement('main'); const modal = document.createElement('section'); document.body.append(app, modal); const cleanup = ariaHideOutside(modal); expect(app.getAttribute('aria-hidden')).toBe('true'); expect(app.inert).toBe(true); cleanup(); expect(app.hasAttribute('aria-hidden')).toBe(false); expect(app.inert).toBe(false); app.remove(); modal.remove(); });
  it('restores pre-existing aria-hidden value', () => { const app = document.createElement('div'); app.setAttribute('aria-hidden', 'false'); const modal = document.createElement('div'); document.body.append(app, modal); const cleanup = ariaHideOutside(modal); cleanup(); expect(app.getAttribute('aria-hidden')).toBe('false'); app.remove(); modal.remove(); });
  it('hides outside light-DOM and Shadow-DOM siblings when a modal lives in Shadow DOM', () => {
    const external = document.createElement('aside');
    const host = document.createElement('section');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const shadowApp = document.createElement('main');
    const shadowModal = document.createElement('div');
    shadow.append(style, shadowApp, shadowModal);
    document.body.append(external, host);

    const cleanup = ariaHideOutside(shadowModal);
    expect(external.getAttribute('aria-hidden')).toBe('true');
    expect(external.inert).toBe(true);
    expect(shadowApp.getAttribute('aria-hidden')).toBe('true');
    expect(shadowApp.inert).toBe(true);
    expect(style.hasAttribute('aria-hidden')).toBe(false);
    expect(shadowModal.hasAttribute('aria-hidden')).toBe(false);

    cleanup();
    expect(external.hasAttribute('aria-hidden')).toBe(false);
    expect(external.inert).toBe(false);
    expect(shadowApp.hasAttribute('aria-hidden')).toBe(false);
    expect(shadowApp.inert).toBe(false);
    external.remove();
    host.remove();
  });
});
