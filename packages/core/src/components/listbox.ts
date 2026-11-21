import { ListCollection, SelectionManager, type CollectionItem, type SelectionMode } from '../primitives/collection';
import { getDirectionalKey, type Direction, type Orientation } from '../primitives/keyboard';
import { Typeahead } from '../primitives/typeahead';

export type ListboxOption<T = unknown> = CollectionItem<T>;
export type ListboxValue = string | string[];
export interface ListboxOptions<T = unknown> {
  options: readonly ListboxOption<T>[];
  value?: ListboxValue;
  defaultValue?: ListboxValue;
  selectionMode?: SelectionMode;
  disabled?: boolean;
  orientation?: Orientation;
  direction?: Direction;
  loop?: boolean;
  locale?: string;
  onValueChange?: (value: ListboxValue) => void;
}

/** Accessible listbox behavior. Render option elements and bind the returned props. */
export class ListboxController<T = unknown> {
  private options: ListboxOptions<T>;
  private collection: ListCollection<T>;
  private selection: SelectionManager;
  private internalValue: string[];
  private activeKey?: string;
  private rootElement: HTMLElement | null = null;
  private typeahead = new Typeahead();

  constructor(options: ListboxOptions<T>) {
    this.options = { selectionMode: 'single', orientation: 'vertical', direction: 'ltr', loop: true, ...options };
    this.collection = new ListCollection(options.options);
    this.internalValue = this.normalizeValue(options.defaultValue ?? (this.mode === 'multiple' ? [] : ''));
    this.selection = new SelectionManager(this.collection, this.mode, this.internalValue);
    this.activeKey = this.collection.getFirstKey();
  }

  get mode(): SelectionMode { return this.options.selectionMode ?? 'single'; }
  get selectedKeys(): string[] { return this.options.value === undefined ? [...this.internalValue] : this.normalizeValue(this.options.value); }
  get activeOption(): ListboxOption<T> | undefined { return this.activeKey ? this.collection.getItem(this.activeKey) : undefined; }

  updateOptions(options: Partial<ListboxOptions<T>>): void {
    this.options = { ...this.options, ...options };
    if (options.options) this.collection.setItems(options.options);
    this.selection.updateCollection(this.collection);
    this.selection.updateMode(this.mode);
    if (options.value !== undefined) this.selection.setSelected(this.normalizeValue(options.value));
    if (this.activeKey && !this.collection.has(this.activeKey)) this.activeKey = this.collection.getFirstKey();
  }

  setActiveKey(key: string): void {
    if (this.options.disabled || this.collection.getItem(key)?.disabled || !this.collection.has(key)) return;
    this.activeKey = key;
  }

  select(key: string): void {
    if (this.options.disabled || this.collection.getItem(key)?.disabled) return;
    if (this.mode === 'multiple') this.selection.toggle(key);
    else this.selection.select(key);
    this.commitSelection();
    this.selection.setAnchor(key);
  }

  selectAll(): void {
    if (this.mode !== 'multiple' || this.options.disabled) return;
    this.selection.selectAll();
    this.commitSelection();
  }

  getRootProps(id: string) {
    return {
      id,
      role: 'listbox' as const,
      tabIndex: this.options.disabled ? -1 : 0,
      'aria-disabled': this.options.disabled || undefined,
      'aria-multiselectable': this.mode === 'multiple' || undefined,
      'aria-orientation': this.options.orientation,
      'aria-activedescendant': this.activeKey,
      ref: (element: HTMLElement | null) => { this.rootElement = element; },
      onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event),
    };
  }

  getOptionProps(key: string) {
    const item = this.collection.getItem(key);
    const active = key === this.activeKey;
    const selected = this.selectedKeys.includes(key);
    return {
      id: key,
      role: 'option' as const,
      'aria-selected': selected,
      'aria-disabled': item?.disabled || undefined,
      'data-active': active ? '' : undefined,
      'data-selected': selected ? '' : undefined,
      'data-disabled': item?.disabled ? '' : undefined,
      tabIndex: -1,
      onPointerMove: () => this.setActiveKey(key),
      onClick: () => { this.setActiveKey(key); this.rootElement?.focus(); this.select(key); },
    };
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.options.disabled || event.isComposing || event.keyCode === 229) return;
    const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr');
    const enabled = this.collection.getEnabledItems();
    if (!enabled.length) return;
    const current = enabled.findIndex((item) => item.key === this.activeKey);
    const vertical = (this.options.orientation ?? 'vertical') === 'vertical';
    const previous = vertical ? 'ArrowUp' : 'ArrowLeft';
    const next = vertical ? 'ArrowDown' : 'ArrowRight';

    if (key === next || key === previous) {
      event.preventDefault();
      const delta = key === next ? 1 : -1;
      const index = current < 0 ? (delta > 0 ? 0 : enabled.length - 1) : current + delta;
      const targetIndex = this.options.loop === false
        ? Math.max(0, Math.min(enabled.length - 1, index))
        : (index + enabled.length) % enabled.length;
      this.activeKey = enabled[targetIndex]?.key;
      return;
    }
    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      this.activeKey = key === 'Home' ? enabled[0]?.key : enabled.at(-1)?.key;
      return;
    }
    if (this.mode === 'multiple' && (key === ' ' || (event.ctrlKey && key.toLowerCase() === 'a'))) {
      event.preventDefault();
      if (event.ctrlKey) this.selectAll();
      else if (this.activeKey) this.select(this.activeKey);
      return;
    }
    if (key === 'Enter' && this.activeKey) {
      event.preventDefault();
      this.select(this.activeKey);
      return;
    }
    if (Array.from(key).length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = this.typeahead.push(key, enabled.map((item) => item.textValue ?? String(item.value)), current, this.options.locale);
      if (index >= 0) this.activeKey = enabled[index]?.key;
    }
  }

  private commitSelection(): void {
    const selected = [...this.selection.getSelection()];
    if (this.options.value === undefined) this.internalValue = selected;
    this.options.onValueChange?.(this.mode === 'multiple' ? selected : selected[0] ?? '');
  }
  private normalizeValue(value: ListboxValue): string[] { return Array.isArray(value) ? [...new Set(value)] : value ? [value] : []; }
}

export function createListboxController<T = unknown>(options: ListboxOptions<T>): ListboxController<T> {
  return new ListboxController(options);
}
