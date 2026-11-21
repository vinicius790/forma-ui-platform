import { getNextIndex, isComposing } from '../primitives/keyboard';
import { DismissableLayer } from '../primitives/dismissable-layer';
import { Typeahead } from '../primitives/typeahead';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectValue = string | string[];

export interface SelectOptions {
  value?: SelectValue;
  defaultValue?: SelectValue;
  multiple?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: SelectValue) => void;
  options?: SelectOption[];
  disabled?: boolean;
  loop?: boolean;
}

/**
 * Select-only listbox controller. Supports single and multiple selection; use a
 * native <select> when its semantics and appearance meet the product needs.
 */
export class SelectController {
  private internalValue: SelectValue;
  private openState: boolean;
  private cleanupLayer?: () => void;
  private activeIndex = -1;
  private options: SelectOption[];
  private trigger: HTMLElement | null = null;
  private listbox: HTMLElement | null = null;
  private typeahead = new Typeahead();

  constructor(private config: SelectOptions = {}) {
    this.internalValue = this.normalizeValue(config.defaultValue ?? this.emptyValue());
    this.openState = config.defaultOpen ?? false;
    this.options = config.options ?? [];
    this.activeIndex = this.findInitialActiveIndex();
  }

  get value(): SelectValue {
    return this.normalizeValue(this.config.value ?? this.internalValue);
  }

  get selectedValues(): string[] {
    const value = this.value;
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  get selectedOption(): SelectOption | undefined {
    const selected = new Set(this.selectedValues);
    return this.options.find((option) => selected.has(option.value));
  }

  get selectedOptions(): SelectOption[] {
    const selected = new Set(this.selectedValues);
    return this.options.filter((option) => selected.has(option.value));
  }

  get open(): boolean {
    return this.openState;
  }

  get multiple(): boolean {
    return Boolean(this.config.multiple);
  }

  get activeOptionIndex(): number {
    return this.activeIndex;
  }

  updateOptions(options: Partial<SelectOptions>): void {
    this.config = { ...this.config, ...options };
    if (options.options) this.setOptions(options.options);
    if (this.config.disabled) this.hide();
    if (options.multiple !== undefined) {
      this.internalValue = this.normalizeValue(this.internalValue);
      this.activeIndex = this.findInitialActiveIndex();
    }
  }

  setOptions(options: SelectOption[]): void {
    const activeValue = this.options[this.activeIndex]?.value;
    this.options = [...options];

    const preserved = this.options.findIndex(
      (option) => option.value === activeValue && !option.disabled,
    );
    if (preserved >= 0) {
      this.activeIndex = preserved;
      return;
    }
    this.activeIndex = this.findInitialActiveIndex();
  }

  setTrigger(element: HTMLElement | null): void {
    this.trigger = element;
  }

  setListbox(element: HTMLElement | null): void {
    this.deactivateLayer();
    this.listbox = element;
    if (this.openState && element) this.activateLayer();
  }

  show(): void {
    if (this.config.disabled || this.openState) return;
    this.openState = true;
    this.activeIndex = this.findInitialActiveIndex();
    this.activateLayer();
    this.scrollActive();
    this.config.onOpenChange?.(true);
  }

  hide(): void {
    if (!this.openState) return;
    this.openState = false;
    this.deactivateLayer();
    this.typeahead.reset();
    this.config.onOpenChange?.(false);
  }

  toggle(): void {
    if (this.open) this.hide();
    else this.show();
  }

  select(value: string): void {
    if (this.config.disabled) return;
    const option = this.options.find((candidate) => candidate.value === value);
    if (!option || option.disabled) return;

    if (this.multiple) {
      const current = this.selectedValues;
      const next = current.includes(value)
        ? current.filter((selected) => selected !== value)
        : [...current, value];
      if (this.config.value === undefined) this.internalValue = next;
      this.config.onValueChange?.(next);
      return;
    }

    if (this.config.value === undefined) this.internalValue = value;
    this.config.onValueChange?.(value);
    this.hide();
    this.trigger?.focus();
  }

  getTriggerProps(listboxId: string, labelId?: string, describedBy?: string) {
    return {
      type: 'button' as const,
      role: 'combobox',
      disabled: Boolean(this.config.disabled),
      'aria-haspopup': 'listbox' as const,
      'aria-expanded': this.open,
      'aria-controls': listboxId,
      'aria-labelledby': labelId,
      'aria-describedby': describedBy,
      'aria-activedescendant': this.open && this.options[this.activeIndex]
        ? `${listboxId}-option-${this.activeIndex}`
        : undefined,
      onClick: () => this.toggle(),
      onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event),
    };
  }

  getListboxProps(id: string, labelId?: string) {
    return {
      id,
      role: 'listbox',
      'aria-labelledby': labelId,
      'aria-multiselectable': this.multiple ? true : undefined,
      'data-state': this.open ? 'open' : 'closed',
    };
  }

  getOptionProps(option: SelectOption, index: number, listboxId = 'forma-select-listbox') {
    return {
      id: `${listboxId}-option-${index}`,
      'data-option-index': index,
      role: 'option',
      tabIndex: -1,
      'aria-selected': this.selectedValues.includes(option.value),
      'aria-disabled': option.disabled || undefined,
      'data-highlighted': this.activeIndex === index ? '' : undefined,
      onPointerMove: () => {
        if (!option.disabled) {
          this.activeIndex = index;
          this.scrollActive();
        }
      },
      onClick: () => this.select(option.value),
    };
  }

  onKeyDown(event: KeyboardEvent): void {
    if (isComposing(event)) return;

    if (event.key === 'Escape' && this.open) {
      event.preventDefault();
      this.hide();
      return;
    }
    if (event.key === 'Tab' && this.open) {
      this.hide();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open) {
        this.show();
        return;
      }
      this.move(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if ((event.key === 'Home' || event.key === 'End') && this.open) {
      event.preventDefault();
      const enabled = this.enabledIndices();
      this.activeIndex = event.key === 'Home' ? enabled[0] ?? -1 : enabled.at(-1) ?? -1;
      this.scrollActive();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.open) this.show();
      else {
        const option = this.options[this.activeIndex];
        if (option) this.select(option.value);
      }
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    if (!this.open && this.multiple) this.show();
    const next = this.typeahead.push(
      event.key,
      this.options.map((option) => option.label),
      this.activeIndex,
    );
    if (next < 0 || this.options[next]?.disabled) return;

    this.activeIndex = next;
    if (this.open) this.scrollActive();
    else this.select(this.options[next]!.value);
  }

  destroy(): void {
    this.openState = false;
    this.deactivateLayer();
    this.typeahead.reset();
    this.trigger = null;
    this.listbox = null;
  }

  private emptyValue(): SelectValue {
    return this.config.multiple ? [] : '';
  }

  private normalizeValue(value: SelectValue): SelectValue {
    if (this.config.multiple) {
      const values = Array.isArray(value) ? value : value ? [value] : [];
      return [...new Set(values)];
    }
    return Array.isArray(value) ? value[0] ?? '' : value;
  }

  private findInitialActiveIndex(): number {
    const selected = new Set(this.selectedValues);
    const selectedIndex = this.options.findIndex(
      (option) => selected.has(option.value) && !option.disabled,
    );
    return selectedIndex >= 0 ? selectedIndex : this.enabledIndices()[0] ?? -1;
  }

  private activateLayer(): void {
    if (!this.listbox || this.cleanupLayer) return;
    const layer = new DismissableLayer({
      element: this.listbox,
      dismissOnEscape: false,
      dismissOnOutsidePointer: true,
      dismissOnOutsideFocus: true,
      excludeElements: () => [this.trigger],
      onDismiss: () => this.hide(),
    });
    this.cleanupLayer = layer.mount();
  }

  private deactivateLayer(): void {
    this.cleanupLayer?.();
    this.cleanupLayer = undefined;
  }

  private enabledIndices(): number[] {
    return this.options
      .map((option, index) => option.disabled ? -1 : index)
      .filter((index) => index >= 0);
  }

  private move(delta: number): void {
    const enabled = this.enabledIndices();
    const position = enabled.indexOf(this.activeIndex);
    const next = getNextIndex(position < 0 ? 0 : position, enabled.length, delta, this.config.loop !== false);
    if (next >= 0) this.activeIndex = enabled[next]!;
    this.scrollActive();
  }

  private scrollActive(): void {
    const option = this.listbox?.querySelector<HTMLElement>(
      `[data-option-index="${this.activeIndex}"]`,
    );
    option?.scrollIntoView?.({ block: 'nearest' });
  }
}

export function createSelectController(options: SelectOptions = {}): SelectController {
  return new SelectController(options);
}

export function createMultiSelectController(
  options: Omit<SelectOptions, 'multiple'> = {},
): SelectController {
  return new SelectController({ ...options, multiple: true });
}
