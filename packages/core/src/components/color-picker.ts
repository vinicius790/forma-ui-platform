import { createId } from '../primitives/id';

export interface HslaColor {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface ColorPickerOptions {
  id?: string;
  value?: HslaColor;
  defaultValue?: Partial<HslaColor>;
  disabled?: boolean;
  onValueChange?: (value: HslaColor) => void;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function hslaToHex({ h, s, l }: HslaColor): string {
  const sNorm = clamp(s, 0, 100) / 100;
  const lNorm = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

export class ColorPickerController {
  private options: ColorPickerOptions;
  private internal: HslaColor;
  readonly baseId: string;

  constructor(options: ColorPickerOptions = {}) {
    this.options = { ...options };
    this.internal = this.normalize({
      h: options.defaultValue?.h ?? 220,
      s: options.defaultValue?.s ?? 80,
      l: options.defaultValue?.l ?? 50,
      a: options.defaultValue?.a ?? 1,
    });
    this.baseId = options.id ?? createId('forma-color-picker');
  }

  private normalize(c: HslaColor): HslaColor {
    return {
      h: ((c.h % 360) + 360) % 360,
      s: clamp(c.s, 0, 100),
      l: clamp(c.l, 0, 100),
      a: clamp(c.a, 0, 1),
    };
  }

  get value(): HslaColor {
    return this.normalize(this.options.value ?? this.internal);
  }

  get hex(): string {
    return hslaToHex(this.value);
  }

  setChannel(patch: Partial<HslaColor>): void {
    if (this.options.disabled) return;
    const next = this.normalize({ ...this.value, ...patch });
    if (this.options.value === undefined) this.internal = next;
    this.options.onValueChange?.(next);
  }

  getAreaProps() {
    const { s, l } = this.value;
    return {
      id: `${this.baseId}-area`,
      role: 'slider' as const,
      tabIndex: this.options.disabled ? -1 : 0,
      'aria-label': 'Color saturation and lightness',
      'aria-valuetext': `Saturation ${Math.round(s)}%, Lightness ${Math.round(l)}%, ${this.hex}`,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'>) => {
        if (this.options.disabled) return;
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.setChannel({ s: s + step });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.setChannel({ s: s - step });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.setChannel({ l: l + step });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.setChannel({ l: l - step });
        }
      },
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createColorPickerController(options: ColorPickerOptions = {}): ColorPickerController {
  return new ColorPickerController(options);
}
