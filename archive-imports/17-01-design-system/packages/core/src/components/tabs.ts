import { createId } from '../primitives/id.js';
import { dataAttr } from '../primitives/dom.js';
import {
  getNextRovingIndex,
  type Direction,
  type Orientation
} from '../primitives/roving-tabindex.js';

export interface TabItemConfig {
  value: string;
  disabled?: boolean;
}

export interface TabsOptions {
  id?: string;
  items: TabItemConfig[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: Extract<Orientation, 'horizontal' | 'vertical'>;
  activationMode?: 'automatic' | 'manual';
  dir?: Direction;
  loop?: boolean;
  ariaLabel?: string;
}

export interface TabsState {
  value: string;
  focusedValue: string;
  orientation: Extract<Orientation, 'horizontal' | 'vertical'>;
  activationMode: 'automatic' | 'manual';
  dir: Direction;
}

export interface TabsMachine {
  getState: () => TabsState;
  selectTab: (value: string) => void;
  setDir: (dir: Direction) => void;
  getTabListProps: () => {
    role: 'tablist';
    'aria-orientation': 'horizontal' | 'vertical';
    'aria-label'?: string;
    dir: Direction;
    'data-forma-tabs-list': '';
    'data-orientation': 'horizontal' | 'vertical';
  };
  getTabProps: (
    value: string,
    onFocusMove?: (nextTabId: string) => void
  ) => {
    id: string;
    role: 'tab';
    type: 'button';
    tabIndex: number;
    disabled?: boolean;
    'aria-selected': boolean;
    'aria-disabled'?: true;
    'aria-controls': string;
    'data-forma-tab': '';
    'data-state': 'active' | 'inactive';
    'data-disabled'?: '';
    'data-orientation': 'horizontal' | 'vertical';
    onClick: () => void;
    onFocus: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getPanelProps: (value: string) => {
    id: string;
    role: 'tabpanel';
    tabIndex: number;
    hidden: boolean;
    'aria-labelledby': string;
    'data-forma-tab-panel': '';
    'data-state': 'active' | 'inactive';
    'data-orientation': 'horizontal' | 'vertical';
  };
  subscribe: (listener: (state: TabsState) => void) => () => void;
}

export function createTabsMachine(options: TabsOptions): TabsMachine {
  const baseId = options.id ?? createId('forma-tabs');
  const items = [...options.items];
  const isControlled = options.value !== undefined;
  const firstEnabled = items.find((i) => !i.disabled)?.value ?? items[0]?.value ?? '';
  const initialValue = options.value ?? options.defaultValue ?? firstEnabled;

  let state: TabsState = {
    value: initialValue,
    focusedValue: initialValue,
    orientation: options.orientation ?? 'horizontal',
    activationMode: options.activationMode ?? 'automatic',
    dir: options.dir ?? 'ltr'
  };

  const listeners = new Set<(state: TabsState) => void>();
  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const getTabId = (val: string) => `${baseId}-tab-${val}`;
  const getPanelId = (val: string) => `${baseId}-panel-${val}`;

  const selectTab = (nextValue: string) => {
    const target = items.find((i) => i.value === nextValue);
    if (!target || target.disabled) return;

    if (!isControlled) {
      state = { ...state, value: nextValue, focusedValue: nextValue };
      notify();
    } else {
      state = { ...state, focusedValue: nextValue };
      notify();
    }
    options.onValueChange?.(nextValue);
  };

  return {
    getState() {
      return state;
    },
    selectTab,
    setDir(dir) {
      if (state.dir === dir) return;
      state = { ...state, dir };
      notify();
    },
    getTabListProps() {
      return {
        role: 'tablist',
        'aria-orientation': state.orientation,
        ...(options.ariaLabel ? { 'aria-label': options.ariaLabel } : {}),
        dir: state.dir,
        'data-forma-tabs-list': '',
        'data-orientation': state.orientation
      };
    },
    getTabProps(value, onFocusMove) {
      const item = items.find((i) => i.value === value);
      const isDisabled = Boolean(item?.disabled);
      const isSelected = state.value === value;
      const isFocused = state.focusedValue === value;

      return {
        id: getTabId(value),
        role: 'tab',
        type: 'button',
        tabIndex: isFocused && !isDisabled ? 0 : -1,
        ...(isDisabled ? { disabled: true, 'aria-disabled': true as const } : {}),
        'aria-selected': isSelected,
        'aria-controls': getPanelId(value),
        'data-forma-tab': '',
        'data-state': isSelected ? 'active' : 'inactive',
        'data-disabled': dataAttr(isDisabled),
        'data-orientation': state.orientation,
        onClick: () => selectTab(value),
        onFocus: () => {
          if (!isDisabled && state.focusedValue !== value) {
            state = { ...state, focusedValue: value };
            notify();
          }
        },
        onKeyDown: (event: KeyboardEvent) => {
          if (state.activationMode === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            selectTab(value);
            return;
          }

          const currentIndex = items.findIndex((i) => i.value === value);
          const rovingItems = items.map((i) => ({ id: i.value, disabled: i.disabled }));
          const nextIndex = getNextRovingIndex(rovingItems, currentIndex, event.key, {
            orientation: state.orientation,
            dir: state.dir,
            loop: options.loop ?? true
          });

          if (nextIndex !== null) {
            event.preventDefault();
            const nextItem = items[nextIndex];
            if (!nextItem) return;
            state = { ...state, focusedValue: nextItem.value };
            if (state.activationMode === 'automatic') {
              selectTab(nextItem.value);
            } else {
              notify();
            }
            onFocusMove?.(getTabId(nextItem.value));
          }
        }
      };
    },
    getPanelProps(value) {
      const isSelected = state.value === value;
      return {
        id: getPanelId(value),
        role: 'tabpanel',
        tabIndex: isSelected ? 0 : -1,
        hidden: !isSelected,
        'aria-labelledby': getTabId(value),
        'data-forma-tab-panel': '',
        'data-state': isSelected ? 'active' : 'inactive',
        'data-orientation': state.orientation
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
