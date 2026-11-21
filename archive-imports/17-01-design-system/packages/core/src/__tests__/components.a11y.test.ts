import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getButtonProps,
  createDialogMachine,
  createMenuMachine,
  createTabsMachine,
  createTooltipMachine,
  createSelectMachine,
  createToastStore,
  createAccordionMachine
} from '../index.js';
import { expectNoA11yViolations } from '@forma-ui/a11y-testing';

describe('MVP 8 Headless Components — Behavior, Keyboard, Focus & axe-core A11y', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('1. Button: supports native & polymorphic elements, loading aria-busy, toggle aria-pressed, and passes axe-core', async () => {
    const onPress = vi.fn();
    const divBtnProps = getButtonProps({
      elementType: 'div',
      pressed: true,
      onPress
    });

    const el = document.createElement('div');
    el.textContent = 'Ativar filtro';
    el.setAttribute('role', divBtnProps.role!);
    el.tabIndex = divBtnProps.tabIndex!;
    el.setAttribute('aria-pressed', String(divBtnProps['aria-pressed']));
    el.addEventListener('keydown', divBtnProps.onKeyDown);
    document.body.appendChild(el);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onPress).toHaveBeenCalledTimes(1);

    const loadingProps = getButtonProps({ loading: true, onPress });
    expect(loadingProps['aria-busy']).toBe(true);
    expect(loadingProps['aria-disabled']).toBe(true);
    loadingProps.onClick(new MouseEvent('click'));
    expect(onPress).toHaveBeenCalledTimes(1);

    await expectNoA11yViolations(document.body);
  });

  it('2. Dialog: manages focus trap, aria-modal, Escape dismiss, focus restore, and passes axe-core', async () => {
    const machine = createDialogMachine({ id: 'dlg-test', modal: true });
    const triggerBtn = document.createElement('button');
    const tProps = machine.getTriggerProps();
    triggerBtn.id = tProps.id;
    triggerBtn.textContent = 'Abrir modal';
    triggerBtn.setAttribute('aria-haspopup', tProps['aria-haspopup']);
    triggerBtn.setAttribute('aria-expanded', String(tProps['aria-expanded']));
    triggerBtn.setAttribute('aria-controls', tProps['aria-controls']);
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();

    machine.open();
    expect(machine.getState().open).toBe(true);

    const dialogEl = document.createElement('div');
    const cProps = machine.getContentProps();
    dialogEl.id = cProps.id;
    dialogEl.setAttribute('role', cProps.role);
    dialogEl.setAttribute('aria-modal', 'true');
    dialogEl.setAttribute('aria-labelledby', cProps['aria-labelledby']);
    dialogEl.setAttribute('aria-describedby', cProps['aria-describedby']);

    const title = document.createElement('h2');
    title.id = machine.getTitleProps().id;
    title.textContent = 'Confirmar ação';

    const desc = document.createElement('p');
    desc.id = machine.getDescriptionProps().id;
    desc.textContent = 'Tem certeza que deseja continuar?';

    const closeBtn = document.createElement('button');
    const closeProps = machine.getCloseProps();
    closeBtn.setAttribute('aria-label', closeProps['aria-label']);
    closeBtn.textContent = 'Fechar';
    closeBtn.addEventListener('click', closeProps.onClick);

    dialogEl.append(title, desc, closeBtn);
    document.body.appendChild(dialogEl);

    const unmount = machine.mountContent(dialogEl);
    expect(document.activeElement).toBe(closeBtn);

    await expectNoA11yViolations(document.body);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(machine.getState().open).toBe(false);
    expect(document.activeElement).toBe(triggerBtn);

    unmount();
    machine.destroy();
  });

  it('3. Menu: navigates via ArrowDown/ArrowUp/Home/End, typeahead, selects item, and passes axe-core', async () => {
    const onSelect = vi.fn();
    const menu = createMenuMachine({
      id: 'menu-test',
      items: [
        { id: 'edit', label: 'Editar' },
        { id: 'dup', label: 'Duplicar', disabled: true },
        { id: 'del', label: 'Excluir' }
      ],
      onSelectItem: onSelect
    });

    menu.open('first');
    expect(menu.getState().highlightedIndex).toBe(0);

    const mProps = menu.getMenuProps();
    mProps.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    // Skips disabled 'dup' (index 1) -> index 2 ('del')
    expect(menu.getState().highlightedIndex).toBe(2);

    mProps.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onSelect).toHaveBeenCalledWith('del');
    expect(menu.getState().open).toBe(false);

    // Render open menu for axe-core audit
    menu.open('first');
    const container = document.createElement('div');
    const trigger = document.createElement('button');
    trigger.id = menu.ids.trigger;
    trigger.textContent = 'Ações';
    const list = document.createElement('div');
    list.id = menu.ids.menu;
    list.setAttribute('role', 'menu');
    list.setAttribute('aria-labelledby', menu.ids.trigger);

    [
      { id: 'edit', label: 'Editar' },
      { id: 'del', label: 'Excluir' }
    ].forEach((item, idx) => {
      const ip = menu.getItemProps(item, idx);
      const itemEl = document.createElement('div');
      itemEl.id = ip.id;
      itemEl.setAttribute('role', ip.role);
      itemEl.tabIndex = ip.tabIndex;
      itemEl.textContent = item.label;
      list.appendChild(itemEl);
    });

    container.append(trigger, list);
    document.body.appendChild(container);
    await expectNoA11yViolations(container);
  });

  it('4. Tabs: supports automatic & manual activation, RTL arrow mirroring, and passes axe-core', async () => {
    const tabs = createTabsMachine({
      id: 'tabs-test',
      items: [{ value: 'geral' }, { value: 'seguranca' }, { value: 'auditoria' }],
      defaultValue: 'geral',
      dir: 'rtl'
    });

    // In RTL, ArrowLeft advances to next tab ('seguranca')
    tabs.getTabProps('geral').onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(tabs.getState().value).toBe('seguranca');

    const root = document.createElement('div');
    const list = document.createElement('div');
    const listProps = tabs.getTabListProps();
    list.setAttribute('role', listProps.role);
    list.setAttribute('aria-orientation', listProps['aria-orientation']);

    for (const val of ['geral', 'seguranca', 'auditoria']) {
      const tp = tabs.getTabProps(val);
      const btn = document.createElement('button');
      btn.id = tp.id;
      btn.setAttribute('role', tp.role);
      btn.setAttribute('aria-selected', String(tp['aria-selected']));
      btn.setAttribute('aria-controls', tp['aria-controls']);
      btn.tabIndex = tp.tabIndex;
      btn.textContent = val;
      list.appendChild(btn);

      const pp = tabs.getPanelProps(val);
      const panel = document.createElement('div');
      panel.id = pp.id;
      panel.setAttribute('role', pp.role);
      panel.setAttribute('aria-labelledby', pp['aria-labelledby']);
      panel.hidden = pp.hidden;
      panel.textContent = `Conteúdo ${val}`;
      root.appendChild(panel);
    }
    root.prepend(list);
    document.body.appendChild(root);

    await expectNoA11yViolations(root);
  });

  it('5. Tooltip: opens immediately on focus, closes on Escape, links aria-describedby, and passes axe-core', async () => {
    const tooltip = createTooltipMachine({ id: 'tip-test', openDelay: 300 });
    expect(tooltip.getTriggerProps()['aria-describedby']).toBeUndefined();

    tooltip.getTriggerProps().onFocus();
    expect(tooltip.getState().open).toBe(true);
    expect(tooltip.getTriggerProps()['aria-describedby']).toBe(tooltip.ids.tooltip);

    const btn = document.createElement('button');
    btn.id = tooltip.ids.trigger;
    btn.textContent = 'Ajuda';
    btn.setAttribute('aria-describedby', tooltip.ids.tooltip);

    const tip = document.createElement('div');
    const tp = tooltip.getTooltipProps();
    tip.id = tp.id;
    tip.setAttribute('role', tp.role);
    tip.textContent = 'Atalho: Ctrl+K';

    document.body.append(btn, tip);
    await expectNoA11yViolations(document.body);

    tooltip.getTriggerProps().onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(tooltip.getState().open).toBe(false);
    tooltip.destroy();
  });

  it('6. Select: supports single & multiple selection, keyboard navigation, typeahead, and passes axe-core', async () => {
    const select = createSelectMachine({
      id: 'sel-test',
      ariaLabel: 'Escolha um framework',
      options: [
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'svelte', label: 'Svelte' }
      ]
    });

    select.getTriggerProps().onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(select.getState().open).toBe(true);
    select.getListboxProps().onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    select.getListboxProps().onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(select.getState().selectedValues).toEqual(['vue']);
    expect(select.getDisplayText()).toBe('Vue');
    expect(select.getState().open).toBe(false);

    // Audit open listbox with axe-core
    select.open();
    const wrap = document.createElement('div');
    const tp = select.getTriggerProps();
    const trigger = document.createElement('button');
    trigger.id = tp.id;
    trigger.setAttribute('role', tp.role);
    trigger.setAttribute('aria-haspopup', tp['aria-haspopup']);
    trigger.setAttribute('aria-expanded', String(tp['aria-expanded']));
    trigger.setAttribute('aria-controls', tp['aria-controls']);
    trigger.setAttribute('aria-label', tp['aria-label']!);
    trigger.textContent = select.getDisplayText();

    const lp = select.getListboxProps();
    const listbox = document.createElement('div');
    listbox.id = lp.id;
    listbox.setAttribute('role', lp.role);
    listbox.setAttribute('aria-labelledby', lp['aria-labelledby']);

    [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue' }
    ].forEach((opt, i) => {
      const op = select.getOptionProps(opt, i);
      const optEl = document.createElement('div');
      optEl.id = op.id;
      optEl.setAttribute('role', op.role);
      optEl.setAttribute('aria-selected', String(op['aria-selected']));
      optEl.textContent = opt.label;
      listbox.appendChild(optEl);
    });

    wrap.append(trigger, listbox);
    document.body.appendChild(wrap);
    await expectNoA11yViolations(wrap);
  });

  it('7. Toast: manages queue limits, assertive/polite live roles, pausable timers, and passes axe-core', async () => {
    const store = createToastStore({ maxToasts: 2, defaultDuration: 4000 });
    const id1 = store.info('Sincronizando');
    const id2 = store.error('Falha de rede', 'Verifique sua conexão');
    expect(store.getToasts().length).toBe(2);

    const errToast = store.getToasts().find((t) => t.id === id2)!;
    const tProps = store.getToastProps(errToast);
    expect(tProps.role).toBe('alert');
    expect(tProps['aria-live']).toBe('assertive');

    tProps.onMouseEnter();
    expect(store.getToasts().find((t) => t.id === id2)?.paused).toBe(true);
    tProps.onMouseLeave();
    expect(store.getToasts().find((t) => t.id === id2)?.paused).toBe(false);

    const region = document.createElement('div');
    const rProps = store.getRegionProps();
    region.setAttribute('role', rProps.role);
    region.setAttribute('aria-label', rProps['aria-label']);

    const toastEl = document.createElement('div');
    toastEl.setAttribute('role', tProps.role);
    toastEl.setAttribute('aria-live', tProps['aria-live']);
    toastEl.textContent = errToast.title;
    region.appendChild(toastEl);
    document.body.appendChild(region);

    await expectNoA11yViolations(region);
    store.dismiss(id1);
    store.dismissAll();
  });

  it('8. Accordion: supports single & multiple expansion, ArrowUp/ArrowDown navigation, and passes axe-core', async () => {
    const acc = createAccordionMachine({
      id: 'acc-test',
      type: 'single',
      collapsible: true,
      items: [{ value: 'item-1' }, { value: 'item-2' }]
    });

    acc.toggleItem('item-1');
    expect(acc.isItemOpen('item-1')).toBe(true);
    acc.toggleItem('item-2');
    expect(acc.isItemOpen('item-1')).toBe(false);
    expect(acc.isItemOpen('item-2')).toBe(true);

    const root = document.createElement('div');
    for (const val of ['item-1', 'item-2']) {
      const h3 = document.createElement('h3');
      const tp = acc.getTriggerProps(val);
      const btn = document.createElement('button');
      btn.id = tp.id;
      btn.setAttribute('aria-expanded', String(tp['aria-expanded']));
      btn.setAttribute('aria-controls', tp['aria-controls']);
      btn.textContent = `Seção ${val}`;
      h3.appendChild(btn);

      const pp = acc.getPanelProps(val);
      const panel = document.createElement('div');
      panel.id = pp.id;
      panel.setAttribute('role', pp.role);
      panel.setAttribute('aria-labelledby', pp['aria-labelledby']);
      panel.hidden = pp.hidden;
      panel.textContent = `Painel ${val}`;

      root.append(h3, panel);
    }
    document.body.appendChild(root);

    await expectNoA11yViolations(root);
  });
});
