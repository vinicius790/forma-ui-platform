import { describe, expect, it, vi } from 'vitest';
import { createGridController } from '../components/grid';
import { createPinInputController } from '../components/pin-input';

function keyEvent(key: string, extras: Partial<KeyboardEvent> = {}) {
  return { key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, isComposing: false, keyCode: 0, preventDefault: vi.fn(), ...extras } as unknown as KeyboardEvent;
}

describe('GridController', () => {
  it('exposes correct grid metadata and roving tab stops', () => {
    const grid = createGridController({ rows: 3, columns: 4, selectionMode: 'multiple' });
    expect(grid.getRootProps('Inventory')).toMatchObject({ role: 'grid', 'aria-rowcount': 3, 'aria-colcount': 4, 'aria-multiselectable': true });
    expect(grid.getCellProps({ row: 0, column: 0 }).tabIndex).toBe(0);
    expect(grid.getCellProps({ row: 1, column: 1 })).toMatchObject({ role: 'gridcell', 'aria-rowindex': 2, 'aria-colindex': 2, tabIndex: -1 });
  });

  it('navigates horizontally, vertically, and with Home/End', () => {
    const grid = createGridController({ rows: 3, columns: 4 });
    const onKeyDown = grid.getRootProps().onKeyDown;
    onKeyDown(keyEvent('ArrowRight'));
    expect(grid.activeCell).toEqual({ row: 0, column: 1 });
    onKeyDown(keyEvent('ArrowDown'));
    expect(grid.activeCell).toEqual({ row: 1, column: 1 });
    onKeyDown(keyEvent('End'));
    expect(grid.activeCell).toEqual({ row: 1, column: 3 });
    onKeyDown(keyEvent('Home', { ctrlKey: true }));
    expect(grid.activeCell).toEqual({ row: 0, column: 0 });
  });

  it('mirrors horizontal navigation in RTL and skips disabled cells', () => {
    const grid = createGridController({ rows: 1, columns: 4, direction: 'rtl', isCellDisabled: ({ column }) => column === 2 });
    grid.getRootProps().onKeyDown(keyEvent('ArrowLeft'));
    expect(grid.activeCell).toEqual({ row: 0, column: 1 });
    grid.getRootProps().onKeyDown(keyEvent('ArrowLeft'));
    expect(grid.activeCell).toEqual({ row: 0, column: 3 });
  });

  it('supports multi-selection, select-all, and deselection', () => {
    const grid = createGridController({ rows: 2, columns: 2, selectionMode: 'multiple' });
    grid.selectCell({ row: 0, column: 0 }, true);
    grid.selectCell({ row: 1, column: 1 }, true);
    expect(grid.selectedCells).toHaveLength(2);
    grid.selectAll();
    expect(grid.selectedCells).toHaveLength(4);
    grid.clearSelection();
    expect(grid.selectedCells).toHaveLength(0);
  });

  it('rejects invalid dimensions and out-of-bounds cells', () => {
    expect(() => createGridController({ rows: 0, columns: 2 })).toThrow(RangeError);
    const grid = createGridController({ rows: 2, columns: 2 });
    expect(() => grid.getCellProps({ row: 3, column: 0 })).toThrow(RangeError);
  });
});

describe('PinInputController', () => {
  it('keeps the real digit as the value and delegates masking to native password input', () => {
    const pin = createPinInputController({ length: 4, mask: true });
    pin.setValue('1234');
    expect(pin.value).toBe('1234');
    expect(pin.getInputProps(0)).toMatchObject({ type: 'password', value: '1', maxLength: 1 });
  });

  it('distributes multi-character input and paste across fields', () => {
    const pin = createPinInputController({ length: 6 });
    pin.input(1, '234');
    expect(pin.value).toBe('234');
    pin.paste('987654');
    expect(pin.value).toBe('987654');
  });

  it('moves actual focus on arrows and backspace when DOM inputs are registered', () => {
    const pin = createPinInputController({ length: 3 });
    const elements = Array.from({ length: 3 }, () => ({ focus: vi.fn() }));
    elements.forEach((element, index) => pin.registerInput(index, element as unknown as HTMLInputElement));
    pin.getInputProps(0).onKeyDown(keyEvent('ArrowRight'));
    expect(elements[1]?.focus).toHaveBeenCalledTimes(1);
    pin.getInputProps(1).onKeyDown(keyEvent('ArrowLeft'));
    expect(elements[0]?.focus).toHaveBeenCalledTimes(1);
  });

  it('fires completion only when a new complete value is reached', () => {
    const complete = vi.fn();
    const pin = createPinInputController({ length: 2, onComplete: complete });
    pin.setValue('12');
    pin.setValue('12');
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
