import { describe, expect, it, vi } from 'vitest';
import { createCheckboxController } from '../components/checkbox';
import { createSwitchController } from '../components/switch';
import { createRadioGroupController } from '../components/radio-group';
import { createSliderController } from '../components/slider';
import { getProgressProps } from '../components/progress';
import { getSeparatorProps } from '../components/separator';
import { createPaginationController } from '../components/pagination';
import { createDisclosureController } from '../components/disclosure';
import { createComboboxController } from '../components/combobox';
import { createFormFieldIds, getFormControlProps } from '../components/form-field';

describe('advanced headless controls', () => {
  it('supports mixed checkbox state and native indeterminate synchronization', () => {
    const onChange = vi.fn();
    const checkbox = createCheckboxController({ defaultChecked: 'indeterminate', onCheckedChange: onChange });
    const input = document.createElement('input');
    checkbox.syncInput(input);
    expect(input.indeterminate).toBe(true);
    expect(checkbox.getInputProps()['aria-checked']).toBe('mixed');
    checkbox.toggle();
    expect(checkbox.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('keeps controlled switch state owned by the caller', () => {
    const onChange = vi.fn();
    const toggle = createSwitchController({ checked: false, onCheckedChange: onChange });
    toggle.toggle();
    expect(toggle.checked).toBe(false);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('moves through enabled radio items and respects disabled items', () => {
    const group = createRadioGroupController({ defaultValue: 'one', orientation: 'horizontal' });
    const first = document.createElement('button');
    const disabled = document.createElement('button');
    const last = document.createElement('button');
    group.register({ value: 'one', element: first });
    group.register({ value: 'two', element: disabled, disabled: true });
    group.register({ value: 'three', element: last });
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    group.getRootProps().onKeyDown(event);
    expect(event.defaultPrevented).toBe(true);
    expect(group.value).toBe('three');
    expect(last.tabIndex).toBe(0);
  });

  it('clamps and steps slider values and exposes valid ARIA bounds', () => {
    const slider = createSliderController({ min: 0, max: 10, step: 2, defaultValue: 5 });
    expect(slider.values).toEqual([6]);
    slider.setThumbValue(0, 100);
    expect(slider.values).toEqual([10]);
    expect(slider.getThumbProps()['aria-valuemax']).toBe(10);
  });

  it('supports indeterminate and complete progress states', () => {
    expect(getProgressProps({ value: null })['aria-valuenow']).toBeUndefined();
    expect(getProgressProps({ value: 100 })['data-state']).toBe('complete');
    expect(getProgressProps({ value: 130, max: 120 })['aria-valuenow']).toBe(120);
  });

  it('does not expose a semantic separator when decorative', () => {
    expect(getSeparatorProps({ decorative: true }).role).toBe('none');
    expect(getSeparatorProps({ decorative: false, orientation: 'vertical' })['aria-orientation']).toBe('vertical');
  });

  it('clamps pagination and inserts compact ellipses', () => {
    const pagination = createPaginationController({ pageCount: 30, defaultPage: 15, siblingCount: 1, boundaryCount: 1 });
    expect(pagination.getPageItems()).toEqual([1, 'ellipsis', 14, 15, 16, 'ellipsis', 30]);
    pagination.setPage(99);
    expect(pagination.page).toBe(30);
    expect(pagination.canNext).toBe(false);
  });

  it('exposes disclosure semantics and controlled callbacks', () => {
    const onOpenChange = vi.fn();
    const disclosure = createDisclosureController({ open: false, onOpenChange });
    disclosure.toggle();
    expect(disclosure.open).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(disclosure.getTriggerProps('panel')['aria-expanded']).toBe(false);
  });

  it('filters disabled combobox options and selects the active option', () => {
    const onValueChange = vi.fn();
    const combo = createComboboxController({
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta', disabled: true },
        { value: 'c', label: 'Charlie' },
      ],
      onValueChange,
    });
    combo.setOpen(true);
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    combo.onKeyDown(event);
    expect(combo.activeOption?.value).toBe('a');
    combo.select('a');
    expect(combo.value).toBe('a');
    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(combo.open).toBe(false);
  });

  it('creates connected form-field ids and invalid descriptions', () => {
    const ids = createFormFieldIds('email');
    const props = getFormControlProps({ ...ids, invalid: true });
    expect(props.id).toBe('email');
    expect(props['aria-describedby']).toBe('email-error');
    expect(props['aria-invalid']).toBe(true);
  });
});
