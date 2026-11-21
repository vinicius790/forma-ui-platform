import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
  createAccordionStore,
  createAlertDialogStore,
  createAvatarStore,
  createComboboxStore,
  createListboxStore,
  createMultiSelectStore,
  createNumberFieldStore,
  createOpenStore,
  createPinInputStore,
  createRadioGroupStore,
  createRatingGroupStore,
  createSearchFieldStore,
  createTabsStore,
  createToggleGroupStore,
  createToolbarStore,
  createTooltipStore,
  createTreeViewStore,
  focusTrap,
} from '../index';

describe('Svelte adapters', () => {
  it('applies alertdialog semantics to attached dialog DOM nodes', () => { const dialog = createAlertDialogStore(); const trigger = document.createElement('button'); const content = document.createElement('section'); document.body.append(trigger, content); const triggerAction = dialog.attachTrigger(trigger, 'alert-content'); const contentAction = dialog.attachContent(content, 'alert-title'); expect(trigger.getAttribute('aria-haspopup')).toBe('dialog'); expect(trigger.getAttribute('aria-controls')).toBe('alert-content'); expect(content.getAttribute('role')).toBe('alertdialog'); expect(content.getAttribute('aria-labelledby')).toBe('alert-title'); dialog.set(true); expect(content.dataset['state']).toBe('open'); contentAction.destroy(); triggerAction.destroy(); dialog.destroy(); trigger.remove(); content.remove(); });
  it('exposes a writable open store', () => { const open = createOpenStore(false); open.set(true); expect(get(open)).toBe(true); });
  it('keeps the selected tab synchronized through its store', () => { const tabs = createTabsStore('home'); tabs.controller.select('settings'); expect(get(tabs.value)).toBe('settings'); });
  it('supports multiselect with writable array values and listbox semantics', () => { const select = createMultiSelectStore([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], ['a']); const listbox = document.createElement('ul'); const action = select.attachListbox(listbox, 'list', 'label'); expect(listbox.getAttribute('role')).toBe('listbox'); expect(listbox.getAttribute('aria-multiselectable')).toBe('true'); expect(listbox.hidden).toBe(true); select.show(); expect(listbox.hidden).toBe(false); select.select('b'); expect(get(select.value)).toEqual(['a', 'b']); expect(get(select.open)).toBe(true); action.destroy(); select.destroy(); });
  it('connects tooltip descriptions and visibility through actions', () => { const tooltip = createTooltipStore({ delayDuration: 0 }); const trigger = document.createElement('button'); const content = document.createElement('div'); const triggerAction = tooltip.attachTrigger(trigger, 'tip'); const contentAction = tooltip.attachContent(content, 'tip'); expect(content.getAttribute('role')).toBe('tooltip'); expect(content.hidden).toBe(true); tooltip.controller.setOpen(true); expect(trigger.getAttribute('aria-describedby')).toBe('tip'); expect(content.hidden).toBe(false); contentAction.destroy(); triggerAction.destroy(); tooltip.destroy(); });
  it('provides accordion store and DOM focus action', () => { const accordion = createAccordionStore('one'); accordion.controller.toggle('two'); expect(get(accordion.value)).toEqual('two'); const node = document.createElement('div'); node.tabIndex = -1; document.body.append(node); const action = focusTrap(node); expect(document.activeElement).toBe(node); action.destroy(); node.remove(); });
  it('provides extended stores for collections, tree views, combobox, and form controls', () => {
    const listbox = createListboxStore({ options: [{ key: 'a', value: 'a' }, { key: 'b', value: 'b' }] });
    listbox.select('b');
    expect(get(listbox.value)).toBe('b');

    const tree = createTreeViewStore({ nodes: [{ key: 'root', value: 'Root', children: [{ key: 'leaf', value: 'Leaf' }] }] });
    tree.toggleExpanded('root');
    expect(get(tree.expandedKeys).has('root')).toBe(true);

    const combobox = createComboboxStore({ options: [{ value: 'x', label: 'X-Ray' }] });
    combobox.select('x');
    expect(get(combobox.value)).toBe('x');
    expect(get(combobox.inputValue)).toBe('X-Ray');

    const numberField = createNumberFieldStore({ defaultValue: 10, min: 0, max: 12 });
    numberField.value.set(20);
    expect(get(numberField.value)).toBe(12);

    const search = createSearchFieldStore({ defaultValue: 'abc' });
    search.clear();
    expect(get(search.value)).toBe('');

    const toggleGroup = createToggleGroupStore({ type: 'multiple' });
    const btn = document.createElement('button');
    const unregToggle = toggleGroup.register({ value: 'bold', element: btn });
    toggleGroup.toggle('bold');
    expect(get(toggleGroup.value)).toEqual(['bold']);
    unregToggle();

    const radio = createRadioGroupStore({ defaultValue: 'one' });
    const rbtn = document.createElement('button');
    const unregRadio = radio.register({ value: 'two', element: rbtn });
    radio.value.set('two');
    expect(get(radio.value)).toBe('two');
    unregRadio();

    const pin = createPinInputStore({ length: 4 });
    pin.paste('9876');
    expect(get(pin.value)).toBe('9876');
    pin.destroy();

    const rating = createRatingGroupStore({ count: 5 });
    rating.value.set(4);
    expect(get(rating.value)).toBe(4);

    const avatar = createAvatarStore({ src: 'https://example.com/p.png' });
    expect(get(avatar.imageState)).toBe('loading');
    avatar.controller.imageLoaded();
    expect(get(avatar.imageState)).toBe('loaded');

    const toolbar = createToolbarStore({ label: 'Formatting' });
    expect(toolbar.getRootProps()['aria-label']).toBe('Formatting');
  });
});
