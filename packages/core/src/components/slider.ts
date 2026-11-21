import type { Direction, Orientation } from '../primitives/keyboard';
export type SliderValue = number | number[];
export interface SliderOptions { min?: number; max?: number; step?: number; value?: SliderValue; defaultValue?: SliderValue; disabled?: boolean; orientation?: Orientation; direction?: Direction; minStepsBetweenThumbs?: number; onValueChange?: (value: SliderValue) => void; getValueText?: (value: number, index: number) => string }
const finite = (n: number, fallback: number) => Number.isFinite(n) ? n : fallback;
export class SliderController {
  private options: SliderOptions; private internal: number[];
  constructor(options: SliderOptions = {}) { this.options = { ...options }; this.internal = this.normalizeValues(options.defaultValue ?? options.min ?? 0); }
  get min(): number { return finite(this.options.min ?? 0, 0); }
  get max(): number { return Math.max(this.min, finite(this.options.max ?? 100, 100)); }
  get values(): number[] { return this.normalizeValues(this.options.value ?? this.internal); }
  get value(): SliderValue { const values = this.values; return Array.isArray(this.options.value ?? this.options.defaultValue) || values.length > 1 ? values : values[0] ?? this.min; }
  updateOptions(options: Partial<SliderOptions>): void { this.options = { ...this.options, ...options }; }
  setValue(next: SliderValue, index = 0): void {
    if (this.options.disabled) return;
    const current = this.values;
    let values: number[];
    if (current.length > 1 && !Array.isArray(next)) {
      if (index < 0 || index >= current.length) return;
      values = [...current];
      const lower = index === 0 ? this.min : (values[index - 1] ?? this.min) + this.gap;
      const upper = index === values.length - 1 ? this.max : (values[index + 1] ?? this.max) - this.gap;
      values[index] = this.normalizeOne(Math.min(upper, Math.max(lower, next)));
    } else {
      values = this.normalizeValues(next);
      if (values.length > 1 && this.options.minStepsBetweenThumbs) {
        for (let i = 1; i < values.length; i++) {
          const minimum = (values[i - 1] ?? this.min) + this.gap;
          if ((values[i] ?? this.min) < minimum) values[i] = Math.min(this.max, this.normalizeOne(minimum));
        }
        for (let i = values.length - 2; i >= 0; i--) {
          const maximum = (values[i + 1] ?? this.max) - this.gap;
          if ((values[i] ?? this.min) > maximum) values[i] = Math.max(this.min, this.normalizeOne(maximum));
        }
      }
    }
    if (this.options.value === undefined) this.internal = values;
    const isMulti = Array.isArray(this.options.value ?? this.options.defaultValue) || values.length > 1 || Array.isArray(next);
    const output: SliderValue = isMulti ? values : values[0] ?? this.min;
    this.options.onValueChange?.(output);
  }
  setThumbValue(index: number, next: number): void { this.setValue(next, index); }
  getThumbProps(index = 0) {
    const values = this.values; const value = values[index] ?? this.min; const low = index === 0 ? this.min : (values[index - 1] ?? this.min) + this.gap; const high = index === values.length - 1 ? this.max : (values[index + 1] ?? this.max) - this.gap;
    return { role: 'slider' as const, tabIndex: this.options.disabled ? -1 : 0, 'aria-valuemin': low, 'aria-valuemax': high, 'aria-valuenow': value, 'aria-valuetext': this.options.getValueText?.(value, index), 'aria-orientation': this.options.orientation ?? 'horizontal', 'aria-disabled': this.options.disabled || undefined, 'data-disabled': this.options.disabled ? '' : undefined, onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event, index) };
  }
  private get gap(): number { return Math.max(0, this.options.minStepsBetweenThumbs ?? 0) * this.step; }
  private get step(): number { return Math.max(Number.EPSILON, finite(this.options.step ?? 1, 1)); }
  private normalizeOne(value: number): number { const clamped = Math.min(this.max, Math.max(this.min, finite(value, this.min))); const maxSteps = Math.max(0, Math.floor((this.max - this.min) / this.step + 1e-10)); const steps = Math.max(0, Math.min(maxSteps, Math.round((clamped - this.min) / this.step))); const rounded = Math.min(this.max, this.min + steps * this.step); return Number(rounded.toFixed(10)); }
  private normalizeValues(value: SliderValue): number[] { const raw = Array.isArray(value) ? [...value] : [value]; if (!raw.length) raw.push(this.min); return raw.map((item) => this.normalizeOne(item)).sort((a, b) => a - b); }
  private onKeyDown(event: KeyboardEvent, index: number): void { if (this.options.disabled) return; const current = this.values[index] ?? this.min; const horizontal = (this.options.orientation ?? 'horizontal') === 'horizontal'; const rtl = this.options.direction === 'rtl'; let next = current; const increment = event.shiftKey ? this.step * 10 : this.step;
    switch (event.key) { case 'ArrowRight': next += horizontal && rtl ? -increment : increment; break; case 'ArrowLeft': next += horizontal && rtl ? increment : -increment; break; case 'ArrowUp': next += increment; break; case 'ArrowDown': next -= increment; break; case 'PageUp': next += this.step * 10; break; case 'PageDown': next -= this.step * 10; break; case 'Home': next = this.min; break; case 'End': next = this.max; break; default: return; } event.preventDefault(); this.setThumbValue(index, next); }
}
export function createSliderController(options: SliderOptions = {}): SliderController { return new SliderController(options); }
