import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  Button,
  ToastViewport,
  toast,
  useAvatar,
  useCombobox,
  useDialog,
  useListbox,
  useMultiSelect,
  useNumberField,
  usePinInput,
  useRadioGroup,
  useRatingGroup,
  useSearchField,
  useSelect,
  useTabs,
  useToggleGroup,
  useToolbar,
  useTreeView,
} from '../index';

function DialogHarness() { const dialog = useDialog(); return createElement('div', null, createElement('button', { ...dialog.triggerProps }, 'Open'), dialog.open ? createElement('section', { ...dialog.contentProps }, 'Dialog body', createElement('button', { onClick: dialog.close }, 'Close')) : null); }
function MultiSelectHarness() { const select = useMultiSelect({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], defaultValue: ['a'] }); return createElement('div', null, createElement('button', { onClick: () => select.controller.select('b') }, 'Select B'), createElement('output', null, select.value.join(',')), createElement('div', select.listboxProps)); }
function SelectHarness() { const select = useSelect({ options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }] }); return createElement('div', null, createElement('span', select.labelProps, 'Choose a value'), createElement('button', select.triggerProps, 'Choose'), createElement('ul', select.listboxProps, ...[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }].map((option, index) => createElement('li', select.getOptionProps(option, index), option.label)))); }
function TabsHarness() { const tabs = useTabs({ defaultValue: 'one' }); return createElement('div', null, createElement('button', { onClick: () => tabs.select('two') }, 'Go two'), createElement('output', null, tabs.value)); }
function ExtendedControlsHarness() {
  const listbox = useListbox({ options: [{ key: 'a', value: 'a', textValue: 'Alpha' }, { key: 'b', value: 'b', textValue: 'Beta' }] });
  const combobox = useCombobox({ options: [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }] });
  const tree = useTreeView({ nodes: [{ key: 'root', value: 'Root', children: [{ key: 'child', value: 'Child' }] }] });
  const numberField = useNumberField({ defaultValue: 2, min: 0, max: 10 });
  const searchField = useSearchField({ defaultValue: 'query' });
  const toggleGroup = useToggleGroup({ defaultValue: 'left' });
  const radioGroup = useRadioGroup({ defaultValue: 'r1' });
  const pinInput = usePinInput({ length: 4, defaultValue: '12' });
  const ratingGroup = useRatingGroup({ count: 5, defaultValue: 3 });
  const avatar = useAvatar({ alt: 'Ada' });
  const toolbar = useToolbar({ label: 'Actions' });
  return createElement(
    'div',
    null,
    createElement('ul', listbox.getRootProps(), createElement('li', listbox.getOptionProps('a'), 'Alpha')),
    createElement('input', { 'aria-label': 'Combo', ...combobox.getInputProps('combo-list') }),
    createElement('ul', combobox.getListboxProps('combo-list')),
    createElement('ul', tree.getRootProps('Files'), createElement('li', tree.getItemProps('root'), 'Root')),
    createElement('input', { 'aria-label': 'Qty', ...numberField.inputProps }),
    createElement('button', { ...numberField.incrementButtonProps }, 'Inc'),
    createElement('input', { 'aria-label': 'Filter', ...searchField.inputProps }),
    createElement('div', toggleGroup.getRootProps('Align'), createElement('button', toggleGroup.getItemProps('left'), 'Left')),
    createElement('div', radioGroup.rootProps, createElement('button', radioGroup.getItemProps('r1'), 'R1')),
    createElement('div', pinInput.rootProps, createElement('input', pinInput.getInputProps(0))),
    createElement('div', ratingGroup.getRootProps(), createElement('button', ratingGroup.getItemProps(4), '4 stars')),
    createElement('span', avatar.fallbackProps, 'AL'),
    createElement('div', toolbar.rootProps),
  );
}

describe('React adapters', () => {
  afterEach(cleanup);
  it('renders a native button and forwards click', () => { const click = vi.fn(); render(createElement(Button, { onClick: click }, 'Save')); fireEvent.click(screen.getByRole('button', { name: 'Save' })); expect(click).toHaveBeenCalledOnce(); });
  it('provides controlled dialog open/close state', () => { render(createElement(DialogHarness)); fireEvent.click(screen.getByRole('button', { name: 'Open' })); expect(screen.getByRole('dialog')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Close' })); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); });
  it('supports controlled component state for multiselect adapters', () => { render(createElement(MultiSelectHarness)); fireEvent.click(screen.getByRole('button', { name: 'Select B' })); expect(screen.getByText('a,b')).toBeInTheDocument(); expect(document.querySelector('[role="listbox"]')).toHaveAttribute('aria-multiselectable', 'true'); });
  it('provides connected accessible label, active descendant and option ids for Select', () => { render(createElement(SelectHarness)); const trigger = screen.getByRole('combobox', { name: 'Choose a value' }); fireEvent.click(trigger); const listbox = screen.getByRole('listbox'); expect(trigger).toHaveAttribute('aria-controls', listbox.id); expect(trigger).toHaveAttribute('aria-activedescendant', `${listbox.id}-option-0`); expect(document.getElementById(`${listbox.id}-option-0`)).toHaveAttribute('role', 'option'); });
  it('exposes tab selection state to React consumers', () => { render(createElement(TabsHarness)); fireEvent.click(screen.getByRole('button', { name: 'Go two' })); expect(screen.getByText('two')).toBeInTheDocument(); });
  it('renders toast notifications from the shared store', () => {
    render(createElement(ToastViewport));
    act(() => {
      toast({ title: 'Saved' });
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Saved' }));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });
  it('binds extended headless hooks cleanly in JSX', () => {
    render(createElement(ExtendedControlsHarness));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Increase value' }));
    expect(screen.getByLabelText('Qty')).toHaveValue(3);
  });
});
