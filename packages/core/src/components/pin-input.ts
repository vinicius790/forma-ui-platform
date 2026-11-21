import { createId } from '../primitives/id';

export interface PinInputOptions {
  value?: string;
  defaultValue?: string;
  length?: number;
  otp?: boolean;
  mask?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  label?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
}

/**
 * Accessible one-character-per-input PIN/OTP controller.
 * The controller never masks the value itself: native `type="password"`
 * handles presentation while the actual digit remains the input value.
 */
export class PinInputController {
  private options: PinInputOptions;
  private internal: string;
  private inputs = new Map<number, HTMLInputElement>();
  private focusedIndex = 0;
  private destroyed = false;
  private readonly idPrefix: string;

  constructor(options: PinInputOptions = {}) {
    this.options = { length: 6, label: 'Verification code', ...options };
    this.internal = this.clean(options.defaultValue ?? '');
    this.idPrefix = createId('pin', 'forma');
  }

  get value(): string { return this.clean(this.options.value ?? this.internal); }
  get length(): number { return Math.max(1, Math.min(32, Math.floor(this.options.length ?? 6))); }
  get focusedIndexValue(): number { return this.focusedIndex; }

  updateOptions(options: Partial<PinInputOptions>): void {
    this.assertActive();
    this.options = { ...this.options, ...options };
    this.internal = this.clean(this.internal);
  }

  getRootProps(label = this.options.label) {
    return {
      role: 'group' as const,
      'aria-label': label,
      'aria-disabled': this.options.disabled || undefined,
      'data-forma-pin-input': '',
    };
  }

  registerInput(index: number, element: HTMLInputElement | null): () => void {
    this.assertActive();
    if (!Number.isInteger(index) || index < 0 || index >= this.length) return () => undefined;
    if (element) this.inputs.set(index, element);
    else this.inputs.delete(index);
    return () => { if (this.inputs.get(index) === element) this.inputs.delete(index); };
  }

  focus(index: number): void {
    this.assertActive();
    const next = Math.max(0, Math.min(this.length - 1, Math.floor(index)));
    this.focusedIndex = next;
    this.inputs.get(next)?.focus();
  }

  setValue(value: string): void {
    this.assertActive();
    if (this.options.disabled || this.options.readOnly) return;
    const previous = this.value;
    const next = this.clean(value);
    if (this.options.value === undefined) this.internal = next;
    if (next !== previous) this.options.onValueChange?.(next);
    if (next.length === this.length && next !== previous) this.options.onComplete?.(next);
  }

  input(index: number, text: string): void {
    this.assertActive();
    if (index < 0 || index >= this.length || this.options.disabled || this.options.readOnly) return;
    const chars = Array.from(this.value.padEnd(this.length, ' '));
    const digits = this.clean(text);
    if (!digits) {
      chars[index] = ' ';
      this.setValue(chars.join('').trimEnd());
      return;
    }
    for (let offset = 0; offset < digits.length && index + offset < this.length; offset += 1) {
      chars[index + offset] = digits[offset] ?? ' ';
    }
    this.setValue(chars.join('').trimEnd());
    this.focus(Math.min(this.length - 1, index + digits.length));
  }

  paste(text: string): void {
    this.assertActive();
    if (this.options.disabled || this.options.readOnly) return;
    const next = this.clean(text);
    this.setValue(next);
    this.focus(Math.min(this.length - 1, next.length));
  }

  getInputProps(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.length) {
      throw new RangeError(`PIN input index must be between 0 and ${this.length - 1}.`);
    }
    const char = Array.from(this.value)[index] ?? '';
    return {
      ref: (element: HTMLInputElement | null) => { this.registerInput(index, element); },
      id: `${this.idPrefix}-${index}`,
      type: this.options.mask ? 'password' as const : 'text' as const,
      inputMode: 'numeric' as const,
      autoComplete: this.options.otp && index === 0 ? 'one-time-code' : undefined,
      pattern: '[0-9]*',
      maxLength: 1,
      value: char,
      disabled: this.options.disabled,
      readOnly: this.options.readOnly,
      placeholder: this.options.placeholder,
      'aria-label': `${this.options.label ?? 'Verification code'}: ${index + 1} of ${this.length}`,
      'data-forma-pin-index': index,
      onFocus: () => { this.focusedIndex = index; },
      onInput: (event: Event) => this.input(index, (event.currentTarget as HTMLInputElement).value),
      onPaste: (event: ClipboardEvent) => {
        const text = event.clipboardData?.getData('text');
        if (text) { event.preventDefault(); this.paste(text); }
      },
      onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event, index),
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.inputs.clear();
  }

  private onKeyDown(event: KeyboardEvent, index: number): void {
    if (this.options.disabled || this.options.readOnly || event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Backspace' && !this.value[index]) {
      event.preventDefault();
      this.focus(index - 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focus(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focus(index + 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focus(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focus(this.length - 1);
    }
  }

  private clean(value: string): string { return value.replace(/[^0-9]/gu, '').slice(0, this.length); }
  private assertActive(): void { if (this.destroyed) throw new Error('PinInputController has been destroyed.'); }
}

export function createPinInputController(options: PinInputOptions = {}): PinInputController {
  return new PinInputController(options);
}
