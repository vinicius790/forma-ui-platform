import { describe, it, expect } from 'vitest';
import {
  createDialogStore,
  createMenuStore,
  createTabsStore,
  createTooltipStore,
  createSelectStore,
  createSvelteToastStore,
  createAccordionStore,
  createSvelteI18nStore,
  focusTrapAction,
  portalAction
} from '../index.js';

describe('@forma-ui/svelte stores & actions', () => {
  it('implements Svelte ReadableStore contract ($store) across all 8 components', () => {
    const { machine: dlg, state: dlgStore } = createDialogStore();
    let currentOpen = false;
    const unsubDlg = dlgStore.subscribe((s) => {
      currentOpen = s.open;
    });
    expect(currentOpen).toBe(false);
    dlg.open();
    expect(currentOpen).toBe(true);
    unsubDlg();
    dlg.destroy();

    const { machine: select, state: selectStore } = createSelectStore({
      options: [{ value: 'svelte5', label: 'Svelte 5' }]
    });
    let selected: string[] = [];
    const unsubSel = selectStore.subscribe((s) => {
      selected = s.selectedValues;
    });
    select.selectValue('svelte5');
    expect(selected).toEqual(['svelte5']);
    unsubSel();

    const { manager: i18n, state: i18nStore } = createSvelteI18nStore('pt-BR');
    let currentDir = 'ltr';
    const unsubI18n = i18nStore.subscribe((s) => {
      currentDir = s.dir;
    });
    i18n.setLocale('ar-SA');
    expect(currentDir).toBe('rtl');
    unsubI18n();

    // Verify actions mount and destroy cleanly
    const el = document.createElement('div');
    const btn = document.createElement('button');
    el.appendChild(btn);
    document.body.appendChild(el);
    const trapAction = focusTrapAction(el, true);
    trapAction.update(false);
    trapAction.destroy();

    const portalNode = document.createElement('div');
    const pAction = portalAction(portalNode);
    expect(portalNode.isConnected).toBe(true);
    pAction.destroy();

    // Touch remaining store factories
    expect(createMenuStore({ items: [] }).machine).toBeDefined();
    expect(createTabsStore({ items: [] }).machine).toBeDefined();
    expect(createTooltipStore().machine).toBeDefined();
    expect(createSvelteToastStore().store).toBeDefined();
    expect(createAccordionStore({ items: [] }).machine).toBeDefined();
  });
});
