import { describe, expect, it, vi } from 'vitest';
import { createSelectController } from '../components/select';

const options = [{ value: 'a', label: 'Árvore' }, { value: 'b', label: 'Barco' }, { value: 'c', label: 'Casa', disabled: true }];
describe('select-only controller', () => {
  it('opens, navigates, commits and closes', () => { const change = vi.fn(); const select = createSelectController({ options, defaultValue: 'a', onValueChange: change }); select.show(); select.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })); select.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })); expect(change).toHaveBeenCalledWith('b'); expect(select.open).toBe(false); });
  it('Escape closes without changing the confirmed value', () => { const select = createSelectController({ options, defaultValue: 'a' }); select.show(); select.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })); select.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })); expect(select.value).toBe('a'); });
  it('ignores disabled options and exposes combobox contract', () => { const select = createSelectController({ options }); select.select('c'); expect(select.value).toBe(''); expect(select.getTriggerProps('options').role).toBe('combobox'); });
  it('supports multiple selection without closing and exposes listbox multiselect semantics', () => {
    const select = createSelectController({ options, multiple: true, defaultValue: ['a'] });
    select.show();
    select.select('b');
    expect(select.value).toEqual(['a', 'b']);
    expect(select.open).toBe(true);
    expect(select.getListboxProps('list')['aria-multiselectable']).toBe(true);
    expect(select.getOptionProps(options[0]!, 0)['aria-selected']).toBe(true);
    select.select('a');
    expect(select.value).toEqual(['b']);
    select.hide();
    select.destroy();
  });
  it('dismisses on outside pointer and focus while preserving trigger interaction', () => {
    const changes = vi.fn();
    const trigger = document.createElement('button');
    const listbox = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(trigger, listbox, outside);
    const select = createSelectController({ options, onOpenChange: changes });
    select.setTrigger(trigger);
    select.setListbox(listbox);
    select.show();
    expect(select.open).toBe(true);
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(select.open).toBe(false);
    select.show();
    outside.focus();
    expect(select.open).toBe(false);
    expect(changes).toHaveBeenCalledWith(true);
    expect(changes).toHaveBeenCalledWith(false);
    select.destroy();
    trigger.remove(); listbox.remove(); outside.remove();
  });
});
