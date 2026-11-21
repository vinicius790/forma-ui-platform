import { createId } from '../primitives/id.js';
import { dataAttr } from '../primitives/dom.js';
import { getNextRovingIndex, type Direction } from '../primitives/roving-tabindex.js';
import { createTypeahead } from '../primitives/typeahead.js';

export interface MenuItemConfig {
  id: string;
  label: string;
  disabled?: boolean;
  type?: 'item' | 'checkbox' | 'radio';
  checked?: boolean;
  onSelect?: () => void;
}

export interface MenuOptions {
  id?: string;
  items: MenuItemConfig[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectItem?: (itemId: string) => void;
  closeOnSelect?: boolean;
  loop?: boolean;
  dir?: Direction;
  ariaLabel?: string;
}

export interface MenuState {
  open: boolean;
  highlightedIndex: number;
  dir: Direction;
}

export interface MenuMachine {
  ids: {
    trigger: string;
    menu: string;
  };
  getState: () => MenuState;
  open: (focusTarget?: 'first' | 'last') => void;
  close: () => void;
  toggle: () => void;
  setItems: (items: MenuItemConfig[]) => void;
  setDir: (dir: Direction) => void;
  getTriggerProps: () => {
    id: string;
    type: 'button';
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
    'aria-controls': string;
    'data-forma-menu-trigger': '';
    'data-state': 'open' | 'closed';
    onClick: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getMenuProps: () => {
    id: string;
    role: 'menu';
    tabIndex: number;
    dir: Direction;
    'aria-label': string;
    'aria-labelledby': string;
    'aria-activedescendant'?: string;
    'data-forma-menu': '';
    'data-state': 'open' | 'closed';
    onKeyDown: (event: KeyboardEvent) => void;
  };
  getItemProps: (item: MenuItemConfig, index: number) => {
    id: string;
    role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
    tabIndex: number;
    'aria-disabled'?: true;
    'aria-checked'?: boolean;
    'data-forma-menu-item': '';
    'data-highlighted'?: '';
    'data-disabled'?: '';
    onClick: () => void;
    onMouseEnter: () => void;
  };
  subscribe: (listener: (state: MenuState) => void) => () => void;
}

export function createMenuMachine(options: MenuOptions): MenuMachine {
  const baseId = options.id ?? createId('forma-menu');
  const ids = {
    trigger: `${baseId}-trigger`,
    menu: `${baseId}-list`
  };

  let items = [...options.items];
  const isControlled = options.open !== undefined;
  const closeOnSelect = options.closeOnSelect ?? true;
  const loop = options.loop ?? true;
  const typeahead = createTypeahead();

  let state: MenuState = {
    open: options.open ?? options.defaultOpen ?? false,
    highlightedIndex: -1,
    dir: options.dir ?? 'ltr'
  };

  const listeners = new Set<(state: MenuState) => void>();
  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const getItemDomId = (itemId: string) => `${baseId}-item-${itemId}`;

  const findFirstEnabled = () => items.findIndex((item) => !item.disabled);
  const findLastEnabled = () => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i]?.disabled) return i;
    }
    return -1;
  };

  const setOpen = (nextOpen: boolean, focusTarget: 'first' | 'last' = 'first') => {
    const nextHighlight = nextOpen
      ? focusTarget === 'last'
        ? findLastEnabled()
        : findFirstEnabled()
      : -1;

    if (!nextOpen) typeahead.reset();

    if (!isControlled) {
      state = { ...state, open: nextOpen, highlightedIndex: nextHighlight };
      notify();
    } else {
      state = { ...state, highlightedIndex: nextHighlight };
      notify();
    }
    options.onOpenChange?.(nextOpen);
  };

  const activateItem = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    item.onSelect?.();
    options.onSelectItem?.(item.id);
    if (closeOnSelect) {
      setOpen(false);
    }
  };

  return {
    ids,
    getState() {
      return state;
    },
    open(focusTarget = 'first') {
      setOpen(true, focusTarget);
    },
    close() {
      setOpen(false);
    },
    toggle() {
      setOpen(!state.open);
    },
    setItems(nextItems) {
      items = [...nextItems];
    },
    setDir(dir) {
      if (state.dir === dir) return;
      state = { ...state, dir };
      notify();
    },
    getTriggerProps() {
      return {
        id: ids.trigger,
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': state.open,
        'aria-controls': ids.menu,
        'data-forma-menu-trigger': '',
        'data-state': state.open ? 'open' : 'closed',
        onClick: () => setOpen(!state.open, 'first'),
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true, 'first');
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true, 'last');
          }
        }
      };
    },
    getMenuProps() {
      const activeItem =
        state.highlightedIndex >= 0 ? items[state.highlightedIndex] : undefined;
      return {
        id: ids.menu,
        role: 'menu',
        tabIndex: -1,
        dir: state.dir,
        'aria-label': options.ariaLabel ?? 'Menu de opções',
        'aria-labelledby': ids.trigger,
        ...(activeItem ? { 'aria-activedescendant': getItemDomId(activeItem.id) } : {}),
        'data-forma-menu': '',
        'data-state': state.open ? 'open' : 'closed',
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            return;
          }

          if (event.key === 'Tab') {
            setOpen(false);
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (state.highlightedIndex >= 0) {
              activateItem(state.highlightedIndex);
            }
            return;
          }

          const nextNav = getNextRovingIndex(items, state.highlightedIndex, event.key, {
            orientation: 'vertical',
            dir: state.dir,
            loop
          });
          if (nextNav !== null) {
            event.preventDefault();
            state = { ...state, highlightedIndex: nextNav };
            notify();
            return;
          }

          const typeaheadIndex = typeahead.handleKey(
            event.key,
            items,
            state.highlightedIndex
          );
          if (typeaheadIndex !== null) {
            event.preventDefault();
            state = { ...state, highlightedIndex: typeaheadIndex };
            notify();
          }
        }
      };
    },
    getItemProps(item, index) {
      const isHighlighted = state.highlightedIndex === index;
      const role =
        item.type === 'checkbox'
          ? 'menuitemcheckbox'
          : item.type === 'radio'
            ? 'menuitemradio'
            : 'menuitem';

      return {
        id: getItemDomId(item.id),
        role,
        tabIndex: -1,
        ...(item.disabled ? { 'aria-disabled': true as const } : {}),
        ...(item.type === 'checkbox' || item.type === 'radio'
          ? { 'aria-checked': Boolean(item.checked) }
          : {}),
        'data-forma-menu-item': '',
        'data-highlighted': dataAttr(isHighlighted),
        'data-disabled': dataAttr(item.disabled),
        onClick: () => activateItem(index),
        onMouseEnter: () => {
          if (!item.disabled && state.highlightedIndex !== index) {
            state = { ...state, highlightedIndex: index };
            notify();
          }
        }
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
