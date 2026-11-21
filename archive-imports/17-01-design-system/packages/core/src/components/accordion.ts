import { createId } from '../primitives/id.js';
import { dataAttr } from '../primitives/dom.js';
import { getNextRovingIndex, type Direction } from '../primitives/roving-tabindex.js';

export interface AccordionItemConfig {
  value: string;
  disabled?: boolean;
}

export interface AccordionOptions {
  id?: string;
  items: AccordionItemConfig[];
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  dir?: Direction;
  loop?: boolean;
}

export interface AccordionState {
  openValues: string[];
  type: 'single' | 'multiple';
  collapsible: boolean;
  dir: Direction;
}

export interface AccordionMachine {
  getState: () => AccordionState;
  isItemOpen: (value: string) => boolean;
  toggleItem: (value: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setDir: (dir: Direction) => void;
  getRootProps: () => {
    dir: Direction;
    'data-forma-accordion': '';
  };
  getItemProps: (value: string) => {
    'data-forma-accordion-item': '';
    'data-state': 'open' | 'closed';
    'data-disabled'?: '';
  };
  getTriggerProps: (
    value: string,
    onFocusMove?: (nextTriggerId: string) => void
  ) => {
    id: string;
    type: 'button';
    disabled?: boolean;
    'aria-expanded': boolean;
    'aria-controls': string;
    'aria-disabled'?: true;
    'data-forma-accordion-trigger': '';
    'data-state': 'open' | 'closed';
    'data-disabled'?: '';
    onClick: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getPanelProps: (value: string) => {
    id: string;
    role: 'region';
    hidden: boolean;
    'aria-labelledby': string;
    'data-forma-accordion-panel': '';
    'data-state': 'open' | 'closed';
  };
  subscribe: (listener: (state: AccordionState) => void) => () => void;
}

export function createAccordionMachine(options: AccordionOptions): AccordionMachine {
  const baseId = options.id ?? createId('forma-accordion');
  const items = [...options.items];
  const type = options.type ?? 'single';
  const collapsible = type === 'multiple' ? true : (options.collapsible ?? true);
  const isControlled = options.value !== undefined;

  let state: AccordionState = {
    openValues: [...(options.value ?? options.defaultValue ?? [])],
    type,
    collapsible,
    dir: options.dir ?? 'ltr'
  };

  const listeners = new Set<(state: AccordionState) => void>();
  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const getTriggerId = (val: string) => `${baseId}-trigger-${val}`;
  const getPanelId = (val: string) => `${baseId}-panel-${val}`;

  const commitValues = (nextValues: string[]) => {
    if (!isControlled) {
      state = { ...state, openValues: nextValues };
      notify();
    }
    options.onValueChange?.(nextValues);
  };

  const toggleItem = (value: string) => {
    const item = items.find((i) => i.value === value);
    if (!item || item.disabled) return;

    const currentlyOpen = state.openValues.includes(value);
    let nextValues: string[];

    if (type === 'multiple') {
      nextValues = currentlyOpen
        ? state.openValues.filter((v) => v !== value)
        : [...state.openValues, value];
    } else if (currentlyOpen) {
      nextValues = collapsible ? [] : [value];
    } else {
      nextValues = [value];
    }

    commitValues(nextValues);
  };

  return {
    getState() {
      return state;
    },
    isItemOpen(value) {
      return state.openValues.includes(value);
    },
    toggleItem,
    expandAll() {
      if (type !== 'multiple') return;
      commitValues(items.filter((i) => !i.disabled).map((i) => i.value));
    },
    collapseAll() {
      if (!collapsible) return;
      commitValues([]);
    },
    setDir(dir) {
      if (state.dir === dir) return;
      state = { ...state, dir };
      notify();
    },
    getRootProps() {
      return {
        dir: state.dir,
        'data-forma-accordion': ''
      };
    },
    getItemProps(value) {
      const item = items.find((i) => i.value === value);
      const isOpen = state.openValues.includes(value);
      return {
        'data-forma-accordion-item': '',
        'data-state': isOpen ? 'open' : 'closed',
        'data-disabled': dataAttr(item?.disabled)
      };
    },
    getTriggerProps(value, onFocusMove) {
      const item = items.find((i) => i.value === value);
      const isDisabled = Boolean(item?.disabled);
      const isOpen = state.openValues.includes(value);

      return {
        id: getTriggerId(value),
        type: 'button',
        ...(isDisabled ? { disabled: true, 'aria-disabled': true as const } : {}),
        'aria-expanded': isOpen,
        'aria-controls': getPanelId(value),
        'data-forma-accordion-trigger': '',
        'data-state': isOpen ? 'open' : 'closed',
        'data-disabled': dataAttr(isDisabled),
        onClick: () => toggleItem(value),
        onKeyDown: (event: KeyboardEvent) => {
          const currentIndex = items.findIndex((i) => i.value === value);
          const rovingItems = items.map((i) => ({ id: i.value, disabled: i.disabled }));
          const nextIndex = getNextRovingIndex(rovingItems, currentIndex, event.key, {
            orientation: 'vertical',
            dir: state.dir,
            loop: options.loop ?? false
          });
          if (nextIndex !== null) {
            event.preventDefault();
            const nextItem = items[nextIndex];
            if (nextItem) {
              onFocusMove?.(getTriggerId(nextItem.value));
            }
          }
        }
      };
    },
    getPanelProps(value) {
      const isOpen = state.openValues.includes(value);
      return {
        id: getPanelId(value),
        role: 'region',
        hidden: !isOpen,
        'aria-labelledby': getTriggerId(value),
        'data-forma-accordion-panel': '',
        'data-state': isOpen ? 'open' : 'closed'
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
