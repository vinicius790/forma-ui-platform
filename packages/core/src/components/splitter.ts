import { createId } from '../primitives/id';

export type SplitterOrientation = 'horizontal' | 'vertical';

export interface SplitterOptions {
  id?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
  orientation?: SplitterOrientation;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
}

export class SplitterController {
  private options: SplitterOptions;
  private internalValue: number;
  private lastNonCollapsed: number;
  readonly primaryPaneId: string;
  readonly secondaryPaneId: string;
  readonly handleId: string;

  constructor(options: SplitterOptions = {}) {
    this.options = {
      min: 0,
      max: 100,
      step: 1,
      largeStep: 10,
      orientation: 'horizontal',
      ...options,
    };
    const initial = this.clamp(options.defaultValue ?? 50);
    this.internalValue = initial;
    this.lastNonCollapsed = initial > (this.options.min ?? 0) ? initial : 50;
    const base = options.id ?? createId('forma-splitter');
    this.primaryPaneId = `${base}-primary`;
    this.secondaryPaneId = `${base}-secondary`;
    this.handleId = `${base}-handle`;
  }

  get min(): number {
    return this.options.min ?? 0;
  }

  get max(): number {
    return this.options.max ?? 100;
  }

  get orientation(): SplitterOrientation {
    return this.options.orientation ?? 'horizontal';
  }

  get value(): number {
    return this.clamp(this.options.value ?? this.internalValue);
  }

  get disabled(): boolean {
    return Boolean(this.options.disabled);
  }

  private clamp(val: number): number {
    return Math.min(this.max, Math.max(this.min, val));
  }

  updateOptions(options: Partial<SplitterOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setValue(next: number): void {
    if (this.disabled) return;
    const clamped = this.clamp(next);
    if (clamped === this.value) return;
    if (clamped > this.min) this.lastNonCollapsed = clamped;
    if (this.options.value === undefined) this.internalValue = clamped;
    this.options.onValueChange?.(clamped);
  }

  toggleCollapse(): void {
    if (this.value > this.min) {
      this.lastNonCollapsed = this.value;
      this.setValue(this.min);
    } else {
      this.setValue(this.lastNonCollapsed);
    }
  }

  handleKeyDown(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'>): void {
    if (this.disabled) return;
    const delta = event.shiftKey ? (this.options.largeStep ?? 10) : (this.options.step ?? 1);
    const isHoriz = this.orientation === 'horizontal';
    if ((isHoriz && event.key === 'ArrowRight') || (!isHoriz && event.key === 'ArrowDown')) {
      event.preventDefault();
      this.setValue(this.value + delta);
    } else if ((isHoriz && event.key === 'ArrowLeft') || (!isHoriz && event.key === 'ArrowUp')) {
      event.preventDefault();
      this.setValue(this.value - delta);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.setValue(this.min);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.setValue(this.max);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.toggleCollapse();
    }
  }

  getHandleProps() {
    return {
      id: this.handleId,
      role: 'separator' as const,
      tabIndex: this.disabled ? -1 : 0,
      'aria-orientation': this.orientation,
      'aria-valuenow': this.value,
      'aria-valuemin': this.min,
      'aria-valuemax': this.max,
      'aria-controls': this.primaryPaneId,
      'aria-disabled': this.disabled ? ('true' as const) : undefined,
      'data-orientation': this.orientation,
      onKeyDown: (e: KeyboardEvent) => this.handleKeyDown(e),
    };
  }

  getPrimaryPaneProps() {
    return { id: this.primaryPaneId, 'data-size': this.value };
  }

  getSecondaryPaneProps() {
    return { id: this.secondaryPaneId, 'data-size': this.max - this.value };
  }

  destroy(): void {
    // Idempotent cleanup hook
  }
}

export function createSplitterController(options: SplitterOptions = {}): SplitterController {
  return new SplitterController(options);
}
