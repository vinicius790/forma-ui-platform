export interface SwitchOptions { checked?: boolean; defaultChecked?: boolean; disabled?: boolean; required?: boolean; name?: string; value?: string; onCheckedChange?: (checked: boolean) => void }
export class SwitchController {
  private internal: boolean;
  private options: SwitchOptions;
  constructor(options: SwitchOptions = {}) { this.options = { ...options }; this.internal = options.defaultChecked ?? false; }
  get checked(): boolean { return this.options.checked ?? this.internal; }
  updateOptions(options: Partial<SwitchOptions>): void { this.options = { ...this.options, ...options }; }
  setChecked(next: boolean): void { if (this.options.disabled || next === this.checked) return; if (this.options.checked === undefined) this.internal = next; this.options.onCheckedChange?.(next); }
  toggle(): void { this.setChecked(!this.checked); }
  getButtonProps() { return { type: 'button' as const, role: 'switch' as const, 'aria-checked': this.checked, 'aria-disabled': this.options.disabled || undefined, disabled: this.options.disabled, 'data-state': this.checked ? 'checked' : 'unchecked', 'data-disabled': this.options.disabled ? '' : undefined, onClick: () => this.toggle() }; }
  getInputProps() { return { type: 'checkbox' as const, name: this.options.name, value: this.options.value ?? 'on', checked: this.checked, disabled: this.options.disabled, required: this.options.required, tabIndex: -1, 'aria-hidden': true as const, style: { position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 } } as const; }
}
export function createSwitchController(options: SwitchOptions = {}): SwitchController { return new SwitchController(options); }
