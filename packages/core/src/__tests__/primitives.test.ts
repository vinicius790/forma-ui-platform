import { describe, expect, it, vi } from 'vitest';
import { FocusTrap, getTabbableCandidates } from '../primitives/focus';
import { RovingTabIndex } from '../primitives/roving-tabindex';
import { Typeahead } from '../primitives/typeahead';
import { createI18n } from '../primitives/i18n';
import { createPortal } from '../primitives/portal';
import { DismissableLayer } from '../primitives/dismissable-layer';
import { lockScroll } from '../primitives/scroll-lock';

describe('shared primitives', () => {
  it('finds tabbable elements and traps focus with wrap-around', () => { const root = document.createElement('div'); root.innerHTML = '<button>First</button><button>Second</button>'; root.tabIndex = -1; document.body.append(root); const [first, second] = getTabbableCandidates(root); const trap = new FocusTrap(root); trap.activate(); expect(document.activeElement).toBe(first); const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true }); second!.focus(); root.dispatchEvent(event); expect(event.defaultPrevented).toBe(true); trap.deactivate(); root.remove(); });
  it('implements roving tabindex and skips disabled elements', () => { const first = document.createElement('button'); const second = document.createElement('button'); const roving = new RovingTabIndex(); roving.register({ id: 'a', element: first }); roving.register({ id: 'b', element: second, disabled: true }); expect(first.tabIndex).toBe(0); expect(second.tabIndex).toBe(-1); });
  it('returns focus to the active trap when script moves focus outside', () => { const root = document.createElement('div'); const inside = document.createElement('button'); const outside = document.createElement('button'); root.append(inside); document.body.append(root, outside); const trap = new FocusTrap(root); trap.activate(); outside.focus(); expect(document.activeElement).toBe(inside); trap.deactivate(); root.remove(); outside.remove(); });
  it('normalizes accents in typeahead', () => { const typeahead = new Typeahead(); expect(typeahead.push('c', ['Café','Casa'])).toBe(0); });
  it('detects RTL locales and permits explicit override', () => { expect(createI18n({ locale: 'ar-EG' }).direction).toBe('rtl'); expect(createI18n({ locale: 'ar', direction: 'ltr' }).direction).toBe('ltr'); });
  it('creates and removes portal nodes', () => { const portal = createPortal(); expect(portal?.element.isConnected).toBe(true); portal?.destroy(); expect(portal?.element.isConnected).toBe(false); });
  it('inherits direction and language from different ancestors', () => { const directionRoot = document.createElement('section'); directionRoot.dir = 'rtl'; const languageRoot = document.createElement('div'); languageRoot.lang = 'ar'; const container = document.createElement('div'); directionRoot.append(languageRoot); languageRoot.append(container); document.body.append(directionRoot); const portal = createPortal({ container }); expect(portal?.element.dir).toBe('rtl'); expect(portal?.element.lang).toBe('ar'); portal?.destroy(); directionRoot.remove(); });
  it('dismisses only top layer on Escape', () => { const node = document.createElement('div'); document.body.append(node); const dismiss = vi.fn(); const layer = new DismissableLayer({ element: node, onDismiss: dismiss }); const cleanup = layer.mount(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); expect(dismiss).toHaveBeenCalledWith('escape'); cleanup(); node.remove(); });
  it('dismisses a menu on outside focus without stealing focus back', async () => { const { createMenuController } = await import('../components/menu'); const menuRoot = document.createElement('div'); const item = document.createElement('button'); const trigger = document.createElement('button'); const outside = document.createElement('button'); menuRoot.append(item); document.body.append(trigger, menuRoot, outside); const menu = createMenuController(); menu.setTrigger(trigger); menu.setContent(menuRoot); menu.registerItem({ id: 'item', element: item }); menu.openMenu(); outside.focus(); expect(menu.open).toBe(false); expect(document.activeElement).toBe(outside); menu.destroy(); trigger.remove(); menuRoot.remove(); outside.remove(); });
  it('reference-counts scroll locks', () => { const body = document.body; const first = lockScroll(body); const second = lockScroll(body); expect(body.style.overflow).toBe('hidden'); first(); expect(body.style.overflow).toBe('hidden'); second(); expect(body.style.overflow).not.toBe('hidden'); });
  it('traps focus across open Shadow DOM trees and restores deep trigger focus', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const trigger = document.createElement('button');
    const dialog = document.createElement('div');
    const first = document.createElement('button');
    const second = document.createElement('button');
    dialog.append(first, second);
    shadow.append(trigger, dialog);
    document.body.append(host);

    trigger.focus();
    const candidates = getTabbableCandidates(dialog);
    expect(candidates).toEqual([first, second]);

    const hostShadowCandidates = getTabbableCandidates(host);
    expect(hostShadowCandidates).toEqual([trigger, first, second]);

    const scopedTrap = new FocusTrap(dialog);
    scopedTrap.activate();
    expect(shadow.activeElement).toBe(first);

    second.focus();
    const tabForward = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true, composed: true });
    second.dispatchEvent(tabForward);
    expect(tabForward.defaultPrevented).toBe(true);
    expect(shadow.activeElement).toBe(first);

    scopedTrap.deactivate();
    expect(shadow.activeElement).toBe(trigger);
    host.remove();
  });
  it('keeps dismissable layers open when interacting with excluded triggers inside Shadow DOM', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const trigger = document.createElement('button');
    shadow.append(trigger);
    const popup = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(host, popup, outside);

    const dismiss = vi.fn();
    const layer = new DismissableLayer({
      element: popup,
      excludeElements: () => [trigger],
      onDismiss: dismiss,
    });
    const cleanup = layer.mount();
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(dismiss).not.toHaveBeenCalled();

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(dismiss).toHaveBeenCalledWith('outside-pointer');
    cleanup();
    host.remove();
    popup.remove();
    outside.remove();
  });
});
