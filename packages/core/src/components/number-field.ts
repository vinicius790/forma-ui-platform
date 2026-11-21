export interface NumberFieldOptions {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  stepSnapping?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  onValueChange?: (value: number) => void;
}

const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
export class NumberFieldController {
  private options: NumberFieldOptions;
  private internal: number;
  constructor(options: NumberFieldOptions = {}) {
    this.options = { step: 1, min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, ...options };
    this.internal = this.normalize(options.defaultValue ?? options.min ?? 0);
  }
  get value(): number { return this.normalize(this.options.value ?? this.internal); }
  get min(): number { return this.options.min ?? Number.NEGATIVE_INFINITY; }
  get max(): number { return this.options.max ?? Number.POSITIVE_INFINITY; }
  updateOptions(options: Partial<NumberFieldOptions>): void { this.options = { ...this.options, ...options }; }
  setValue(value: number): void {
    if (this.options.disabled || this.options.readOnly || !Number.isFinite(value)) return;
    const next = this.normalize(value);
    if (next === this.value) return;
    if (this.options.value === undefined) this.internal = next;
    this.options.onValueChange?.(next);
  }
  increment(multiplier = 1): void { this.setValue(this.value + (this.options.step ?? 1) * multiplier); }
  decrement(multiplier = 1): void { this.setValue(this.value - (this.options.step ?? 1) * multiplier); }
  format(): string { return new Intl.NumberFormat(this.options.locale, this.options.formatOptions).format(this.value); }
  getInputProps() {
    return {
      type: 'number' as const,
      name: this.options.name,
      value: this.value,
      min: this.options.min,
      max: this.options.max,
      step: this.options.step,
      disabled: this.options.disabled,
      readOnly: this.options.readOnly,
      required: this.options.required,
      role: 'spinbutton' as const,
      'aria-valuemin': Number.isFinite(this.min) ? this.min : undefined,
      'aria-valuemax': Number.isFinite(this.max) ? this.max : undefined,
      'aria-valuenow': this.value,
      onChange: (event: Event) => { const next = (event.currentTarget as HTMLInputElement).valueAsNumber; if (Number.isFinite(next)) this.setValue(next); },
      onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event),
    };
  }
  getIncrementButtonProps() { return { type: 'button' as const, disabled: this.options.disabled || this.options.readOnly || this.value >= this.max, 'aria-label': 'Increase value', onClick: () => this.increment() }; }
  getDecrementButtonProps() { return { type: 'button' as const, disabled: this.options.disabled || this.options.readOnly || this.value <= this.min, 'aria-label': 'Decrease value', onClick: () => this.decrement() }; }
  private normalize(value: number): number {
    const min = this.min; const max = this.max; const step = Math.max(Number.EPSILON, Math.abs(finite(this.options.step ?? 1, 1)));
    const clamped = Math.min(max, Math.max(min, finite(value, Number.isFinite(min) ? min : 0)));
    if (this.options.stepSnapping === false || !Number.isFinite(min)) return Number(clamped.toFixed(10));
    const snapped = min + Math.round((clamped - min) / step) * step;
    return Number(Math.min(max, Math.max(min, snapped)).toFixed(10));
  }
  private onKeyDown(event: KeyboardEvent): void {
    if (this.options.disabled || this.options.readOnly) return;
    const multiplier = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowUp': event.preventDefault(); this.increment(multiplier); break;
      case 'ArrowDown': event.preventDefault(); this.decrement(multiplier); break;
      case 'PageUp': event.preventDefault(); this.increment(multiplier * 10); break;
      case 'PageDown': event.preventDefault(); this.decrement(multiplier * 10); break;
      case 'Home': if (Number.isFinite(this.min)) { event.preventDefault(); this.setValue(this.min); } break;
      case 'End': if (Number.isFinite(this.max)) { event.preventDefault(); this.setValue(this.max); } break;
    }
  }
}
export function createNumberFieldController(options: NumberFieldOptions = {}): NumberFieldController { return new NumberFieldController(options); }
