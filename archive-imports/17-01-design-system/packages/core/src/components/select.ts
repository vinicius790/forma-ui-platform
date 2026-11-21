import { createId } from '../primitives/id.js';
import { dataAttr } from '../primitives/dom.js';
import { getNextRovingIndex, type Direction } from '../primitives/roving-tabindex.js';
import { createTypeahead } from '../primitives/typeahead.js';

export interface SelectOptionItem {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectOptions {
  id?: string;
  options: SelectOptionItem[];
  multiple?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  dir?: Direction;
  ariaLabel?: string;
}

export interface SelectState {
  open: boolean;
  selectedValues: string[];
  highlightedIndex: number;
  multiple: boolean;
  disabled: boolean;
  dir: Direction;
}

export interface SelectMachine {
  ids: {
    trigger: string;
    listbox: string;
  };
  getState: () => SelectState;
  getSelectedOptions: () => SelectOptionItem[];
  getDisplayText: () => string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  selectValue: (value: string) => void;
  clearSelection: () => void;
  setOptions: (options: SelectOptionItem[]) => void;
  setDir: (dir: Direction) => void;
  getTriggerProps: () => {
    id: string;
    role: 'combobox';
    type: 'button';
    tabIndex: number;
    disabled?: boolean;
    dir: Direction;
    'aria-haspopup': 'listbox';
    'aria-expanded': boolean;
    'aria-controls': string;
    'aria-activedescendant'?: string;
    'aria-disabled'?: true;
    'aria-required'?: true;
    'aria-label'?: string;
    'data-forma-select-trigger': '';
    'data-state': 'open' | 'closed';
    'data-disabled'?: '';
    'data-placeholder'?: '';
    onClick: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getListboxProps: () => {
    id: string;
    role: 'listbox';
    tabIndex: number;
    dir: Direction;
    'aria-multiselectable'?: true;
    'aria-labelledby': string;
    'data-forma-select-listbox': '';
    'data-state': 'open' | 'closed';
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getOptionProps: (option: SelectOptionItem, index: number) => {
    id: string;
    role: 'option';
    'aria-selected': boolean;
    'aria-disabled'?: true;
    'data-forma-select-option': '';
    'data-state': 'checked' | 'unchecked';
    'data-highlighted'?: '';
    'data-disabled'?: '';
    onClick: () => void;
    onMouseEnter: () => void;
  };
  getHiddenInputProps: () => {
    type: 'hidden';
    name?: string;
    value: string;
    disabled: boolean;
    required?: boolean;
  };
  subscribe: (listener: (state: SelectState) => void) => () => void;
}

function normalizeValues(val: string | string[] | undefined): string[] {
  if (val === undefined) return [];
  return Array.isArray(val) ? [...val] : val === '' ? [] : [val];
}

export function createSelectMachine(options: SelectOptions): SelectMachine {
  const baseId = options.id ?? createId('forma-select');
  const ids = {
    trigger: `${baseId}-trigger`,
    listbox: `${baseId}-listbox`
  };

  let items = [...options.options];
  const multiple = Boolean(options.multiple);
  const isValueControlled = options.value !== undefined;
  const isOpenControlled = options.open !== undefined;
  const typeahead = createTypeahead();

  let state: SelectState = {
    open: options.open ?? options.defaultOpen ?? false,
    selectedValues: normalizeValues(options.value ?? options.defaultValue),
    highlightedIndex: -1,
    multiple,
    disabled: Boolean(options.disabled),
    dir: options.dir ?? 'ltr'
  };

  const listeners = new Set<(state: SelectState) => void>();
  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const getOptionDomId = (val: string) => `${baseId}-option-${val}`;

  const findInitialHighlight = (): number => {
    const firstSelectedIdx = items.findIndex(
      (o) => !o.disabled && state.selectedValues.includes(o.value)
    );
    if (firstSelectedIdx >= 0) return firstSelectedIdx;
    return items.findIndex((o) => !o.disabled);
  };

  const setOpen = (nextOpen: boolean) => {
    if (state.disabled && nextOpen) return;
    const nextHighlight = nextOpen ? findInitialHighlight() : -1;
    if (!nextOpen) typeahead.reset();

    if (!isOpenControlled) {
      state = { ...state, open: nextOpen, highlightedIndex: nextHighlight };
      notify();
    } else {
      state = { ...state, highlightedIndex: nextHighlight };
      notify();
    }
    options.onOpenChange?.(nextOpen);
  };

  const selectValue = (val: string) => {
    if (state.disabled) return;
    const target = items.find((o) => o.value === val);
    if (!target || target.disabled) return;

    let nextValues: string[];
    if (multiple) {
      const exists = state.selectedValues.includes(val);
      nextValues = exists
        ? state.selectedValues.filter((v) => v !== val)
        : [...state.selectedValues, val];
    } else {
      nextValues = [val];
    }

    if (!isValueControlled) {
      state = { ...state, selectedValues: nextValues };
      notify();
    }

    options.onValueChange?.(multiple ? nextValues : nextValues[0] ?? '');

    if (!multiple) {
      setOpen(false);
    }
  };

  const handleNavigationKey = (event: KeyboardEvent): boolean => {
    if (event.key === 'Escape') {
      if (state.open) {
        event.preventDefault();
        setOpen(false);
        return true;
      }
      return false;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!state.open) {
        setOpen(true);
      } else if (state.highlightedIndex >= 0 && items[state.highlightedIndex]) {
        selectValue(items[state.highlightedIndex]!.value);
      }
      return true;
    }

    if (!state.open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setOpen(true);
      return true;
    }

    if (state.open) {
      const rovingItems = items.map((o) => ({ id: o.value, disabled: o.disabled }));
      const nextNav = getNextRovingIndex(rovingItems, state.highlightedIndex, event.key, {
        orientation: 'vertical',
        dir: state.dir,
        loop: false
      });
      if (nextNav !== null) {
        event.preventDefault();
        state = { ...state, highlightedIndex: nextNav };
        notify();
        return true;
      }

      const typeaheadItems = items.map((o) => ({
        id: o.value,
        label: o.label,
        disabled: o.disabled
      }));
      const matchIndex = typeahead.handleKey(
        event.key,
        typeaheadItems,
        state.highlightedIndex
      );
      if (matchIndex !== null) {
        event.preventDefault();
        state = { ...state, highlightedIndex: matchIndex };
        notify();
        return true;
      }
    }

    return false;
  };

  return {
    ids,
    getState() {
      return state;
    },
    getSelectedOptions() {
      return items.filter((item) => state.selectedValues.includes(item.value));
    },
    getDisplayText() {
      const selected = items.filter((item) => state.selectedValues.includes(item.value));
      if (selected.length === 0) {
        return options.placeholder ?? 'Selecione uma opção';
      }
      return selected.map((s) => s.label).join(', ');
    },
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
    toggle() {
      setOpen(!state.open);
    },
    selectValue,
    clearSelection() {
      if (!isValueControlled) {
        state = { ...state, selectedValues: [] };
        notify();
      }
      options.onValueChange?.(multiple ? [] : '');
    },
    setOptions(nextOptions) {
      items = [...nextOptions];
      notify();
    },
    setDir(dir) {
      if (state.dir === dir) return;
      state = { ...state, dir };
      notify();
    },
    getTriggerProps() {
      const activeOption =
        state.open && state.highlightedIndex >= 0
          ? items[state.highlightedIndex]
          : undefined;
      return {
        id: ids.trigger,
        role: 'combobox',
        type: 'button',
        tabIndex: state.disabled ? -1 : 0,
        ...(state.disabled ? { disabled: true, 'aria-disabled': true as const } : {}),
        ...(options.required ? { 'aria-required': true as const } : {}),
        ...(options.ariaLabel ? { 'aria-label': options.ariaLabel } : {}),
        dir: state.dir,
        'aria-haspopup': 'listbox',
        'aria-expanded': state.open,
        'aria-controls': ids.listbox,
        ...(activeOption ? { 'aria-activedescendant': getOptionDomId(activeOption.value) } : {}),
        'data-forma-select-trigger': '',
        'data-state': state.open ? 'open' : 'closed',
        'data-disabled': dataAttr(state.disabled),
        'data-placeholder': dataAttr(state.selectedValues.length === 0),
        onClick: () => setOpen(!state.open),
        onKeyDown: (event: KeyboardEvent) => {
          handleNavigationKey(event);
        }
      };
    },
    getListboxProps() {
      return {
        id: ids.listbox,
        role: 'listbox',
        tabIndex: -1,
        dir: state.dir,
        ...(multiple ? { 'aria-multiselectable': true as const } : {}),
        'aria-labelledby': ids.trigger,
        'data-forma-select-listbox': '',
        'data-state': state.open ? 'open' : 'closed',
        onKeyDown: (event: KeyboardEvent) => {
          handleNavigationKey(event);
        }
      };
    },
    getOptionProps(option, index) {
      const isSelected = state.selectedValues.includes(option.value);
      const isHighlighted = state.highlightedIndex === index;
      return {
        id: getOptionDomId(option.value),
        role: 'option',
        'aria-selected': isSelected,
        ...(option.disabled ? { 'aria-disabled': true as const } : {}),
        'data-forma-select-option': '',
        'data-state': isSelected ? 'checked' : 'unchecked',
        'data-highlighted': dataAttr(isHighlighted),
        'data-disabled': dataAttr(option.disabled),
        onClick: () => selectValue(option.value),
        onMouseEnter: () => {
          if (!option.disabled && state.highlightedIndex !== index) {
            state = { ...state, highlightedIndex: index };
            notify();
          }
        }
      };
    },
    getHiddenInputProps() {
      return {
        type: 'hidden',
        ...(options.name ? { name: options.name } : {}),
        value: state.selectedValues.join(','),
        disabled: state.disabled,
        ...(options.required ? { required: true } : {})
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
