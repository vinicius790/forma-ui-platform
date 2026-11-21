import { describe, expect, it, vi } from 'vitest';
import { createMenuController } from '../components/menu';

describe('menu controller', () => {
  it('moves focus with arrows and Home/End', () => { const menu = createMenuController(); const nodes = ['Alpha','Beta','Gamma'].map((text) => { const element = document.createElement('button'); element.textContent = text; document.body.append(element); return element; }); nodes.forEach((element, i) => menu.registerItem({ id: String(i), element })); menu.openMenu(); expect(document.activeElement).toBe(nodes[0]); menu.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })); expect(document.activeElement).toBe(nodes[1]); menu.onKeyDown(new KeyboardEvent('keydown', { key: 'End', cancelable: true })); expect(document.activeElement).toBe(nodes[2]); nodes.forEach((x) => x.remove()); });
  it('supports normalized typeahead and disabled options', () => { const menu = createMenuController(); const first = document.createElement('button'); const second = document.createElement('button'); document.body.append(first, second); menu.registerItem({ id: '1', element: first, textValue: 'Café' }); menu.registerItem({ id: '2', element: second, textValue: 'Casa', disabled: true }); menu.openMenu(); menu.onKeyDown(new KeyboardEvent('keydown', { key: 'c' })); expect(document.activeElement).toBe(first); menu.destroy(); first.remove(); second.remove(); });
  it('activates the focused item with Enter and Space', () => { for (const key of ['Enter', ' ']) { const onSelect = vi.fn(); const element = document.createElement('button'); document.body.append(element); const menu = createMenuController(); menu.registerItem({ id: key, element, onSelect }); menu.openMenu(); menu.onKeyDown(new KeyboardEvent('keydown', { key, cancelable: true })); expect(onSelect).toHaveBeenCalledTimes(1); expect(menu.open).toBe(false); menu.destroy(); element.remove(); } });
  it('focuses items that register after the menu has opened and preserves active focus after reorder', () => { const menu = createMenuController(); menu.setContent(document.createElement('div')); menu.openMenu(); const first = document.createElement('button'); const second = document.createElement('button'); document.body.append(first, second); const unregisterFirst = menu.registerItem({ id: 'first', element: first }); expect(document.activeElement).toBe(first); menu.registerItem({ id: 'second', element: second }); second.focus(); menu.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })); expect(document.activeElement).toBe(second); unregisterFirst(); expect(document.activeElement).toBe(second); menu.destroy(); first.remove(); second.remove(); });
  it('dismisses on focus moving outside without moving focus back to the trigger', () => {
    const content = document.createElement('div'); const trigger = document.createElement('button'); const outside = document.createElement('button'); const item = document.createElement('button');
    content.append(item); document.body.append(trigger, content, outside);
    const menu = createMenuController(); menu.setTrigger(trigger); menu.setContent(content); menu.registerItem({ id: 'item', element: item }); menu.openMenu();
    outside.focus();
    expect(menu.open).toBe(false); expect(document.activeElement).toBe(outside);
    menu.destroy(); trigger.remove(); content.remove(); outside.remove();
  });
  it('exposes checkbox and radio menu item states and callbacks', () => {
    const checked = vi.fn();
    const element = document.createElement('button');
    const menu = createMenuController();
    const checkbox = { id: 'check', element, checked: false, onCheckedChange: checked, closeOnSelect: false } as const;
    const checkboxProps = menu.getCheckboxItemProps(checkbox);
    expect(checkboxProps.role).toBe('menuitemcheckbox');
    expect(checkboxProps['aria-checked']).toBe(false);
    checkboxProps.onClick();
    expect(checked).toHaveBeenCalledWith(true);
    const radioProps = menu.getRadioItemProps({ id: 'radio', element, checked: false, onCheckedChange: checked });
    expect(radioProps.role).toBe('menuitemradio');
    radioProps.onClick();
    expect(checked).toHaveBeenLastCalledWith(true);
    menu.destroy();
  });
  it('selects active item and closes', () => { const onSelect = vi.fn(); const element = document.createElement('button'); const menu = createMenuController(); menu.registerItem({ id: 'one', element, onSelect }); menu.openMenu(); menu.getItemProps({ id: 'one', element, onSelect }).onClick(); expect(onSelect).toHaveBeenCalled(); expect(menu.open).toBe(false); });
});
