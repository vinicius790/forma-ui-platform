import { getDirectionalKey, type Direction, type Orientation } from '../primitives/keyboard';
export interface RadioItem { value: string; element: HTMLElement; disabled?: boolean; textValue?: string }
export interface RadioGroupOptions { value?: string; defaultValue?: string; disabled?: boolean; required?: boolean; name?: string; orientation?: Orientation; direction?: Direction; loop?: boolean; activationMode?: 'automatic' | 'manual'; onValueChange?: (value: string) => void }
export class RadioGroupController {
  private options: RadioGroupOptions;
  private internal: string;
  private items: RadioItem[] = [];
  constructor(options: RadioGroupOptions = {}) { this.options = { ...options }; this.internal = options.defaultValue ?? ''; }
  get value(): string { return this.options.value ?? this.internal; }
  updateOptions(options: Partial<RadioGroupOptions>): void { this.options = { ...this.options, ...options }; this.syncTabStops(); }
  register(item: RadioItem): () => void { this.items = [...this.items.filter((x) => x.value !== item.value), item]; this.syncTabStops(); return () => { this.items = this.items.filter((x) => x !== item); this.syncTabStops(); }; }
  select(value: string): void { const item = this.items.find((x) => x.value === value); if (this.options.disabled || item?.disabled || value === this.value) return; if (this.options.value === undefined) this.internal = value; this.options.onValueChange?.(value); this.syncTabStops(); }
  getRootProps() { return { role: 'radiogroup' as const, 'aria-orientation': this.options.orientation ?? 'vertical', 'aria-disabled': this.options.disabled || undefined, 'aria-required': this.options.required || undefined, onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event) }; }
  getItemProps(value: string) { const item = this.items.find((x) => x.value === value); const selected = this.value === value; const disabled = Boolean(this.options.disabled || item?.disabled); return { role: 'radio' as const, 'aria-checked': selected, 'aria-disabled': disabled || undefined, tabIndex: !disabled && (selected || (!this.value && this.enabled()[0]?.value === value)) ? 0 : -1, 'data-state': selected ? 'checked' : 'unchecked', onClick: () => this.select(value) }; }
  private enabled(): RadioItem[] { return this.items.filter((item) => !item.disabled); }
  private syncTabStops(): void { const selected = this.enabled().find((x) => x.value === this.value); const fallback = this.enabled()[0]; for (const item of this.items) item.element.tabIndex = item === (selected ?? fallback) && !this.options.disabled ? 0 : -1; }
  private onKeyDown(event: KeyboardEvent): void {
    if (this.options.disabled) return;
    const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr');
    const vertical = (this.options.orientation ?? 'vertical') === 'vertical';
    const previous = vertical ? 'ArrowUp' : 'ArrowLeft'; const next = vertical ? 'ArrowDown' : 'ArrowRight';
    const items = this.enabled(); if (!items.length) return;
    let index = items.findIndex((item) => item.value === this.value); if (index < 0) index = 0;
    if (key === 'Home') index = 0; else if (key === 'End') index = items.length - 1;
    else if (key === previous || key === next) { const delta = key === next ? 1 : -1; const candidate = index + delta; index = this.options.loop === false ? Math.max(0, Math.min(items.length - 1, candidate)) : (candidate + items.length) % items.length; }
    else return;
    event.preventDefault(); const target = items[index]; if (!target) return; target.element.focus(); if ((this.options.activationMode ?? 'automatic') === 'automatic') this.select(target.value);
  }
}
export function createRadioGroupController(options: RadioGroupOptions = {}): RadioGroupController { return new RadioGroupController(options); }
