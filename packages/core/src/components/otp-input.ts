import { createId } from '../primitives/id';

export type OtpMode = 'numeric' | 'alphanumeric' | 'alphabetic';

export interface OtpInputOptions {
  id?: string;
  length?: number;
  mode?: OtpMode;
  mask?: boolean;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
}

const MODE_PATTERNS: Record<OtpMode, RegExp> = {
  numeric: /^[0-9]$/u,
  alphabetic: /^[a-zA-Z]$/u,
  alphanumeric: /^[a-zA-Z0-9]$/u,
};

export class OtpInputController {
  private options: OtpInputOptions;
  private chars: string[];
  private activeIndex = 0;
  readonly baseId: string;

  constructor(options: OtpInputOptions = {}) {
    this.options = { length: 6, mode: 'numeric', mask: false, ...options };
    this.chars = this.normalize(options.defaultValue ?? '');
    this.baseId = options.id ?? createId('forma-otp');
  }

  get length(): number {
    return Math.max(1, Math.trunc(this.options.length ?? 6));
  }

  private isValidChar(ch: string): boolean {
    return MODE_PATTERNS[this.options.mode ?? 'numeric'].test(ch);
  }

  private normalize(raw: string): string[] {
    const out = Array.from({ length: this.length }, () => '');
    let idx = 0;
    for (const ch of raw) {
      if (idx >= this.length) break;
      if (this.isValidChar(ch)) {
        out[idx] = ch;
        idx += 1;
      }
    }
    return out;
  }

  get values(): string[] {
    return this.options.value !== undefined ? this.normalize(this.options.value) : [...this.chars];
  }

  get value(): string {
    return this.values.join('');
  }

  get isComplete(): boolean {
    return this.values.every((c) => c.length === 1);
  }

  get focusedIndex(): number {
    return this.activeIndex;
  }

  updateOptions(options: Partial<OtpInputOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private commit(nextChars: string[]): void {
    const nextValue = nextChars.join('');
    if (this.options.value === undefined) this.chars = nextChars;
    this.options.onValueChange?.(nextValue);
    if (nextChars.every((c) => c.length === 1)) {
      this.options.onComplete?.(nextValue);
    }
  }

  setDigit(index: number, raw: string): void {
    if (this.options.disabled || this.options.readOnly) return;
    if (index < 0 || index >= this.length) return;
    if (raw.length > 1) {
      this.paste(raw, index);
      return;
    }
    const next = this.values;
    if (raw === '') {
      next[index] = '';
      this.commit(next);
      return;
    }
    if (!this.isValidChar(raw)) return;
    next[index] = raw;
    this.activeIndex = Math.min(this.length - 1, index + 1);
    this.commit(next);
  }

  paste(raw: string, startIndex = 0): void {
    if (this.options.disabled || this.options.readOnly) return;
    const next = this.values;
    let cursor = Math.max(0, Math.min(this.length - 1, startIndex));
    for (const ch of raw) {
      if (cursor >= this.length) break;
      if (this.isValidChar(ch)) {
        next[cursor] = ch;
        cursor += 1;
      }
    }
    this.activeIndex = Math.min(this.length - 1, cursor);
    this.commit(next);
  }

  clear(): void {
    if (this.options.disabled || this.options.readOnly) return;
    this.activeIndex = 0;
    this.commit(Array.from({ length: this.length }, () => ''));
  }

  getRootProps(label = 'Verification code') {
    return { id: this.baseId, role: 'group' as const, 'aria-label': label, 'data-complete': this.isComplete ? 'true' : 'false' };
  }

  getInputProps(index: number) {
    const vals = this.values;
    return {
      id: `${this.baseId}-slot-${index}`,
      type: this.options.mask ? ('password' as const) : ('text' as const),
      inputMode: this.options.mode === 'numeric' ? ('numeric' as const) : ('text' as const),
      autoComplete: index === 0 ? ('one-time-code' as const) : ('off' as const),
      maxLength: 1,
      value: vals[index] ?? '',
      disabled: Boolean(this.options.disabled),
      readOnly: Boolean(this.options.readOnly),
      'aria-label': `Digit ${index + 1} of ${this.length}`,
      onFocus: () => { this.activeIndex = index; },
      onInput: (e: { currentTarget?: { value?: string }; target?: { value?: string } }) => {
        this.setDigit(index, e.currentTarget?.value ?? e.target?.value ?? '');
      },
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (vals[index]) this.setDigit(index, '');
          else if (index > 0) {
            this.activeIndex = index - 1;
            this.setDigit(index - 1, '');
          }
        } else if (e.key === 'ArrowLeft' && index > 0) {
          e.preventDefault();
          this.activeIndex = index - 1;
        } else if (e.key === 'ArrowRight' && index < this.length - 1) {
          e.preventDefault();
          this.activeIndex = index + 1;
        }
      },
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createOtpInputController(options: OtpInputOptions = {}): OtpInputController {
  return new OtpInputController(options);
}
