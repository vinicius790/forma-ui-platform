import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFocusTrap,
  getTabbableElements,
  getNextRovingIndex,
  createTypeahead,
  createDismissableLayer,
  createPortalHost,
  createI18nManager,
  getDirectionForLocale,
  resetIdCounter
} from '../index.js';

describe('@forma-ui/core primitives', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    resetIdCounter();
  });

  it('traps focus within container and restores focus upon deactivation', () => {
    const outsideBtn = document.createElement('button');
    outsideBtn.textContent = 'Outside';
    document.body.appendChild(outsideBtn);
    outsideBtn.focus();
    expect(document.activeElement).toBe(outsideBtn);

    const dialog = document.createElement('div');
    const firstBtn = document.createElement('button');
    firstBtn.textContent = 'First';
    const hiddenBtn = document.createElement('button');
    hiddenBtn.hidden = true;
    const lastBtn = document.createElement('button');
    lastBtn.textContent = 'Last';
    dialog.append(firstBtn, hiddenBtn, lastBtn);
    document.body.appendChild(dialog);

    expect(getTabbableElements(dialog)).toEqual([firstBtn, lastBtn]);

    const trap = createFocusTrap({ container: dialog, restoreFocus: true });
    trap.activate();
    expect(document.activeElement).toBe(firstBtn);

    // Tab from last wraps to first
    lastBtn.focus();
    lastBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(firstBtn);

    // Shift+Tab from first wraps to last
    firstBtn.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    );
    expect(document.activeElement).toBe(lastBtn);

    trap.deactivate();
    expect(document.activeElement).toBe(outsideBtn);
  });

  it('mirrors horizontal navigation in RTL mode for roving tabindex', () => {
    const items = [{ id: 'a' }, { id: 'b', disabled: true }, { id: 'c' }];

    // LTR: ArrowRight moves forward skipping disabled 'b' -> index 2
    expect(getNextRovingIndex(items, 0, 'ArrowRight', { orientation: 'horizontal', dir: 'ltr' })).toBe(2);

    // RTL: ArrowLeft moves forward skipping disabled 'b' -> index 2
    expect(getNextRovingIndex(items, 0, 'ArrowLeft', { orientation: 'horizontal', dir: 'rtl' })).toBe(2);
    // RTL: ArrowRight moves backward -> index 0
    expect(getNextRovingIndex(items, 2, 'ArrowRight', { orientation: 'horizontal', dir: 'rtl' })).toBe(0);
  });

  it('supports prefix and repeated-character typeahead matching', () => {
    const typeahead = createTypeahead(500);
    const items = [
      { id: '1', label: 'Argentina' },
      { id: '2', label: 'Alemanha' },
      { id: '3', label: 'Brasil' },
      { id: '4', label: 'Canadá', disabled: true }
    ];

    expect(typeahead.handleKey('a', items, -1)).toBe(0);
    expect(typeahead.handleKey('a', items, 0)).toBe(1);
    typeahead.reset();
    expect(typeahead.handleKey('b', items, 1)).toBe(2);
    typeahead.reset();
    // Disabled item 'Canadá' must be skipped
    expect(typeahead.handleKey('c', items, 0)).toBeNull();
  });

  it('dismisses only the topmost layer on Escape when nested', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    document.body.append(outer, inner);

    const dismissed: string[] = [];
    const outerLayer = createDismissableLayer({
      element: () => outer,
      onDismiss: () => dismissed.push('outer')
    });
    const innerLayer = createDismissableLayer({
      element: () => inner,
      onDismiss: () => dismissed.push('inner')
    });

    outerLayer.activate();
    innerLayer.activate();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dismissed).toEqual(['inner']);

    innerLayer.deactivate();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dismissed).toEqual(['inner', 'outer']);
    outerLayer.deactivate();
  });

  it('mounts and unmounts portals with dir/lang metadata and manages i18n/RTL', () => {
    const i18n = createI18nManager('pt-BR');
    expect(i18n.getState().dir).toBe('ltr');
    expect(i18n.t('select.selectedCount', { count: 2 })).toBe('2 selecionado(s)');

    i18n.setLocale('ar-SA');
    expect(getDirectionForLocale('ar-SA')).toBe('rtl');
    expect(i18n.getState().dir).toBe('rtl');

    const portal = createPortalHost({ id: 'test-portal', dir: i18n.getState().dir, lang: 'ar-SA' });
    const host = portal.mount();
    expect(host?.dir).toBe('rtl');
    expect(host?.lang).toBe('ar-SA');
    portal.unmount();
    expect(document.getElementById('test-portal')).toBeNull();
  });
});
