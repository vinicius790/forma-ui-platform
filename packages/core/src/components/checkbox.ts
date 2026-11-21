export type CheckboxState = boolean | 'indeterminate';
export interface CheckboxOptions {
  checked?: CheckboxState;
  defaultChecked?: CheckboxState;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  onCheckedChange?: (checked: CheckboxState) => void;
}

/** A controlled/uncontrolled checkbox state machine. Bind indeterminate to the native input property. */
export class CheckboxController {
  private internal: CheckboxState;
  private options: CheckboxOptions;
  constructor(options: CheckboxOptions = {}) { this.options = { ...options }; this.internal = options.defaultChecked ?? false; }
  get checked(): CheckboxState { return this.options.checked ?? this.internal; }
  get disabled(): boolean { return Boolean(this.options.disabled); }
  updateOptions(options: Partial<CheckboxOptions>): void { this.options = { ...this.options, ...options }; }
  setChecked(next: CheckboxState): void {
    if (this.disabled || this.options.readOnly || next === this.checked) return;
    if (this.options.checked === undefined) this.internal = next;
    this.options.onCheckedChange?.(next);
  }
  toggle(): void { this.setChecked(this.checked === 'indeterminate' ? true : !this.checked); }
  syncInput(input: HTMLInputElement | null): void { if (input) input.indeterminate = this.checked === 'indeterminate'; }
  getInputProps() {
    return {
      type: 'checkbox' as const,
      checked: this.checked === true,
      disabled: this.disabled,
      required: this.options.required,
      readOnly: this.options.readOnly,
      'aria-readonly': this.options.readOnly || undefined,
      onClick: (event: MouseEvent) => { if (this.options.readOnly) event.preventDefault(); },
      'aria-checked': this.checked === 'indeterminate' ? 'mixed' as const : this.checked,
      'aria-disabled': this.disabled || undefined,
      'data-state': this.checked === 'indeterminate' ? 'indeterminate' : this.checked ? 'checked' : 'unchecked',
      'data-disabled': this.disabled ? '' : undefined,
      onChange: (event: Event) => { this.setChecked((event.currentTarget as HTMLInputElement).checked); this.syncInput(event.currentTarget as HTMLInputElement); },
    };
  }
}
export function createCheckboxController(options: CheckboxOptions = {}): CheckboxController { return new CheckboxController(options); }
