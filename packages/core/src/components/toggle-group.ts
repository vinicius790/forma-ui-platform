import { getDirectionalKey, type Direction, type Orientation } from '../primitives/keyboard';

export interface ToggleItem { value: string; disabled?: boolean; element?: HTMLElement }
export interface ToggleGroupOptions {
  value?: string | string[];
  defaultValue?: string | string[];
  type?: 'single' | 'multiple';
  disabled?: boolean;
  orientation?: Orientation;
  direction?: Direction;
  rovingFocus?: boolean;
  loop?: boolean;
  onValueChange?: (value: string | string[]) => void;
}

export class ToggleGroupController {
  private options: ToggleGroupOptions;
  private internal: string[];
  private items: ToggleItem[] = [];
  private activeValue?: string;
  constructor(options: ToggleGroupOptions = {}) {
    this.options = { type: 'single', orientation: 'horizontal', direction: 'ltr', rovingFocus: true, loop: true, ...options };
    this.internal = this.normalize(options.defaultValue ?? (this.options.type === 'multiple' ? [] : ''));
  }
  get value(): string | string[] {
    return this.options.value === undefined
      ? (this.options.type === 'multiple' ? [...this.internal] : this.internal[0] ?? '')
      : this.options.value;
  }
  updateOptions(options: Partial<ToggleGroupOptions>): void { this.options = { ...this.options, ...options }; this.syncTabStops(); }
  register(item: ToggleItem): () => void {
    this.items = [...this.items.filter((entry) => entry.value !== item.value), item];
    this.activeValue ??= item.disabled ? undefined : item.value;
    this.syncTabStops();
    return () => { this.items = this.items.filter((entry) => entry !== item); if (this.activeValue === item.value) this.activeValue = this.enabled()[0]?.value; this.syncTabStops(); };
  }
  toggle(value: string): void {
    if (this.options.disabled) return;
    const item = this.items.find((entry) => entry.value === value);
    if (!item || item.disabled) return;
    let next: string[];
    if (this.options.type === 'multiple') {
      next = this.normalize(this.value);
      next = next.includes(value) ? next.filter((entry) => entry !== value) : [...next, value];
    } else {
      const current = this.normalize(this.value)[0];
      next = current === value ? [] : [value];
    }
    if (this.options.value === undefined) this.internal = next;
    this.activeValue = value;
    this.options.onValueChange?.(this.options.type === 'multiple' ? next : next[0] ?? '');
    this.syncTabStops();
  }
  getRootProps(label?: string) { return { role: 'group' as const, 'aria-label': label, 'aria-orientation': this.options.orientation, 'aria-disabled': this.options.disabled || undefined, onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event) }; }
  getItemProps(value: string) {
    const item = this.items.find((entry) => entry.value === value);
    const pressed = this.normalize(this.value).includes(value);
    const disabled = Boolean(this.options.disabled || item?.disabled);
    const active = this.activeValue !== undefined ? this.activeValue === value : this.normalize(this.value)[0] === value;
    return { type: 'button' as const, 'aria-pressed': pressed, 'aria-disabled': disabled || undefined, disabled: disabled || undefined, tabIndex: this.options.rovingFocus === false ? undefined : active && !disabled ? 0 : -1, 'data-state': pressed ? 'on' : 'off', onClick: () => this.toggle(value), onFocus: () => { this.activeValue = value; this.syncTabStops(); } };
  }
  private onKeyDown(event: KeyboardEvent): void {
    if (this.options.disabled || this.options.rovingFocus === false) return;
    const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr');
    const horizontal = (this.options.orientation ?? 'horizontal') === 'horizontal';
    const prev = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const next = horizontal ? 'ArrowRight' : 'ArrowDown';
    if (key !== prev && key !== next && key !== 'Home' && key !== 'End') return;
    event.preventDefault();
    const enabled = this.enabled();
    const index = enabled.findIndex((item) => item.value === this.activeValue);
    let targetIndex = key === 'Home' ? 0 : key === 'End' ? enabled.length - 1 : index + (key === next ? 1 : -1);
    if (this.options.loop !== false && key !== 'Home' && key !== 'End' && enabled.length) targetIndex = (targetIndex + enabled.length) % enabled.length;
    else targetIndex = Math.max(0, Math.min(enabled.length - 1, targetIndex));
    const target = enabled[targetIndex];
    if (target) { this.activeValue = target.value; target.element?.focus(); this.syncTabStops(); }
  }
  private enabled(): ToggleItem[] { return this.items.filter((item) => !item.disabled); }
  private normalize(value: string | string[]): string[] { return Array.isArray(value) ? [...new Set(value)] : value ? [value] : []; }
  private syncTabStops(): void { for (const item of this.items) if (item.element) item.element.tabIndex = this.activeValue === item.value && !item.disabled && !this.options.disabled ? 0 : -1; }
}
export function createToggleGroupController(options: ToggleGroupOptions = {}): ToggleGroupController { return new ToggleGroupController(options); }
