import { getDirectionalKey, getNextIndex, isComposing, type Direction, type Orientation } from '../primitives/keyboard';
import { DismissableLayer } from '../primitives/dismissable-layer';
import { Typeahead } from '../primitives/typeahead';

export interface MenuItemRecord {
  id: string;
  type?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  checked?: boolean;
  closeOnSelect?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  element: HTMLElement;
  textValue?: string;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface MenuOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: Direction;
  orientation?: Orientation;
  loop?: boolean;
}

export class MenuController {
  private internalOpen: boolean;
  private trigger: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private items: MenuItemRecord[] = [];
  private activeIndex = -1;
  private typeahead = new Typeahead();
  private cleanupLayer?: () => void;

  constructor(private options: MenuOptions = {}) {
    this.internalOpen = options.defaultOpen ?? false;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  updateOptions(options: Partial<MenuOptions>): void {
    const wasOpen = this.open;
    this.options = { ...this.options, ...options };
    if (wasOpen !== this.open) {
      if (this.open) {
        this.activateLayer();
        this.focusEdge(1);
      } else {
        this.deactivateLayer();
        this.typeahead.reset();
      }
    }
  }

  setTrigger(element: HTMLElement | null): void {
    this.trigger = element;
  }

  setContent(element: HTMLElement | null): void {
    this.deactivateLayer();
    this.content = element;
    if (this.open && element) {
      this.activateLayer();
      this.focusEdge(1);
    }
  }

  registerItem(item: MenuItemRecord): () => void {
    const activeId = this.items[this.activeIndex]?.id;
    this.items = [...this.items.filter((existing) => existing.id !== item.id), item];
    this.activeIndex = activeId
      ? this.items.findIndex((candidate) => candidate.id === activeId && !candidate.disabled)
      : -1;
    if (this.open && this.activeIndex < 0) this.focusEdge(1);

    return () => {
      const currentActiveId = this.items[this.activeIndex]?.id;
      this.items = this.items.filter((existing) => existing.id !== item.id);
      this.activeIndex = currentActiveId
        ? this.items.findIndex((candidate) => candidate.id === currentActiveId && !candidate.disabled)
        : -1;
      if (this.open && this.activeIndex < 0) this.focusEdge(1);
    };
  }

  setOpen(open: boolean, focus: 'first' | 'last' | 'trigger' | 'none' = 'first'): void {
    if (this.open === open) return;
    if (this.options.open !== undefined) {
      this.options.onOpenChange?.(open);
      return;
    }
    this.internalOpen = open;
    this.options.onOpenChange?.(open);

    if (open) {
      this.activateLayer();
      if (focus === 'first') this.focusEdge(1);
      else if (focus === 'last') this.focusEdge(-1);
    } else {
      this.deactivateLayer();
      this.typeahead.reset();
      if (focus === 'trigger') this.trigger?.focus();
    }
  }

  openMenu(edge: 'first' | 'last' = 'first'): void {
    this.setOpen(true, edge);
  }

  close(restoreFocus = true): void {
    this.setOpen(false, restoreFocus ? 'trigger' : 'none');
  }

  getTriggerProps(contentId?: string) {
    return {
      type: 'button' as const,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': this.open,
      'aria-controls': contentId,
      onClick: () => this.setOpen(!this.open, 'first'),
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.openMenu('first');
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          this.openMenu('last');
        }
      },
    };
  }

  getContentProps() {
    return {
      role: 'menu',
      tabIndex: -1,
      'aria-orientation': this.options.orientation ?? 'vertical',
      'data-state': this.open ? 'open' : 'closed',
      onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event),
    };
  }

  getItemProps(item: MenuItemRecord) {
    return {
      role: item.type ?? 'menuitem',
      tabIndex: -1,
      'aria-checked': item.type === 'menuitemcheckbox' || item.type === 'menuitemradio'
        ? Boolean(item.checked)
        : undefined,
      'aria-disabled': item.disabled || undefined,
      'data-disabled': item.disabled ? '' : undefined,
      onClick: () => {
        if (item.disabled) return;
        if (item.type === 'menuitemcheckbox') item.onCheckedChange?.(!item.checked);
        if (item.type === 'menuitemradio') item.onCheckedChange?.(true);
        item.onSelect?.();
        if (item.closeOnSelect !== false) this.close();
      },
      onPointerMove: () => {
        const index = this.items.findIndex((candidate) => candidate.id === item.id);
        if (index >= 0 && !item.disabled) this.focusIndex(index);
      },
    };
  }

  getCheckboxItemProps(item: Omit<MenuItemRecord, 'type'>) {
    return this.getItemProps({ ...item, type: 'menuitemcheckbox' });
  }

  getRadioItemProps(item: Omit<MenuItemRecord, 'type'>) {
    return this.getItemProps({ ...item, type: 'menuitemradio' });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.close(false);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const item = this.items[this.activeIndex];
      if (item && !item.disabled) {
        if (item.type === 'menuitemcheckbox') item.onCheckedChange?.(!item.checked);
        if (item.type === 'menuitemradio') item.onCheckedChange?.(true);
        item.onSelect?.();
        if (item.closeOnSelect !== false) this.close();
      }
      return;
    }

    const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr');
    const vertical = this.options.orientation !== 'horizontal';
    let delta = 0;
    if ((vertical && key === 'ArrowDown') || (!vertical && key === 'ArrowRight')) delta = 1;
    if ((vertical && key === 'ArrowUp') || (!vertical && key === 'ArrowLeft')) delta = -1;

    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      this.focusEdge(key === 'Home' ? 1 : -1);
      return;
    }
    if (delta !== 0) {
      event.preventDefault();
      this.move(delta);
      return;
    }

    if (isComposing(event) || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    const enabled = this.enabled();
    const current = enabled.findIndex((item) => item === this.items[this.activeIndex]);
    const next = this.typeahead.push(event.key, enabled.map((item) => item.textValue ?? item.element.textContent ?? ''), current);
    if (next >= 0) this.focusIndex(this.items.indexOf(enabled[next]!));
  }

  destroy(): void {
    this.deactivateLayer();
    this.typeahead.reset();
    this.items = [];
    this.trigger = null;
    this.content = null;
  }

  private enabled(): MenuItemRecord[] {
    return this.items.filter((item) => !item.disabled);
  }

  private focusEdge(direction: 1 | -1): void {
    const enabled = this.enabled();
    const target = direction === 1 ? enabled[0] : enabled.at(-1);
    if (target) this.focusIndex(this.items.indexOf(target));
    else this.content?.focus();
  }

  private focusIndex(index: number): void {
    const item = this.items[index];
    if (!item || item.disabled) return;
    this.activeIndex = index;
    item.element.focus();
  }

  private move(delta: number): void {
    const enabled = this.enabled();
    const current = enabled.findIndex((item) => item === this.items[this.activeIndex]);
    const next = getNextIndex(current, enabled.length, delta, this.options.loop !== false);
    if (next >= 0) this.focusIndex(this.items.indexOf(enabled[next]!));
  }

  private activateLayer(): void {
    if (!this.content || this.cleanupLayer) return;
    const layer = new DismissableLayer({
      element: this.content,
      onDismiss: (reason) => this.close(reason === 'escape'),
      dismissOnOutsidePointer: true,
      dismissOnOutsideFocus: true,
      excludeElements: () => [this.trigger],
    });
    this.cleanupLayer = layer.mount();
  }

  private deactivateLayer(): void {
    this.cleanupLayer?.();
    this.cleanupLayer = undefined;
  }
}

export function createMenuController(options: MenuOptions = {}): MenuController {
  return new MenuController(options);
}
