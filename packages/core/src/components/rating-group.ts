import type { Direction } from '../primitives/keyboard';
export interface RatingGroupOptions { value?: number; defaultValue?: number; count?: number; disabled?: boolean; readOnly?: boolean; allowClear?: boolean; direction?: Direction; onValueChange?: (value: number) => void }
export class RatingGroupController {
  private options: RatingGroupOptions;
  private internal: number;
  private focused = 1;
  constructor(options: RatingGroupOptions = {}) { this.options = { count: 5, direction: 'ltr', ...options }; this.internal = this.normalize(options.defaultValue ?? 0); this.focused = Math.max(1, this.internal || 1); }
  get value(): number { return this.normalize(this.options.value ?? this.internal); }
  get count(): number { return Math.max(1, Math.floor(this.options.count ?? 5)); }
  updateOptions(options: Partial<RatingGroupOptions>): void { this.options = { ...this.options, ...options }; }
  setValue(value: number): void { if (this.options.disabled || this.options.readOnly) return; const next = this.normalize(value); if (next === this.value && !this.options.allowClear) return; const finalValue = this.options.allowClear && next === this.value ? 0 : next; if (this.options.value === undefined) this.internal = finalValue; this.options.onValueChange?.(finalValue); }
  getRootProps(label = 'Rating') { return { role: 'radiogroup' as const, 'aria-label': label, 'aria-disabled': this.options.disabled || undefined, 'aria-readonly': this.options.readOnly || undefined }; }
  getItemProps(value: number) { const selected = this.value === value; return { role: 'radio' as const, 'aria-checked': selected, 'aria-disabled': this.options.disabled || undefined, tabIndex: this.focused === value && !this.options.disabled ? 0 : -1, 'data-state': selected ? 'checked' : 'unchecked', onFocus: () => { this.focused = value; }, onClick: () => this.setValue(value), onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event, value) }; }
  private onKeyDown(event: KeyboardEvent, value: number): void { if (this.options.disabled || this.options.readOnly) return; const rtl = this.options.direction === 'rtl'; let next = value; switch (event.key) { case 'ArrowRight': next += rtl ? -1 : 1; break; case 'ArrowLeft': next += rtl ? 1 : -1; break; case 'ArrowUp': next += 1; break; case 'ArrowDown': next -= 1; break; case 'Home': next = 1; break; case 'End': next = this.count; break; default: return; } event.preventDefault(); this.focused = Math.max(1, Math.min(this.count, next)); this.setValue(this.focused); }
  private normalize(value: number): number { return Math.max(0, Math.min(this.count, Math.round(Number.isFinite(value) ? value : 0))); }
}
export function createRatingGroupController(options: RatingGroupOptions = {}): RatingGroupController { return new RatingGroupController(options); }
