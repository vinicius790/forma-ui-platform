import { createId } from '../primitives/id';

export type StepStatus = 'upcoming' | 'current' | 'completed' | 'error';

export interface StepperOptions {
  id?: string;
  count: number;
  step?: number;
  defaultStep?: number;
  linear?: boolean;
  disabledSteps?: number[];
  onStepChange?: (step: number) => void;
}

export class StepperController {
  private options: StepperOptions;
  private internalStep: number;
  private completedSteps = new Set<number>();
  private errorSteps = new Set<number>();
  readonly baseId: string;

  constructor(options: StepperOptions) {
    this.options = { linear: false, ...options };
    this.internalStep = this.clamp(options.defaultStep ?? 0);
    this.baseId = options.id ?? createId('forma-stepper');
  }

  get count(): number {
    return Math.max(1, this.options.count);
  }

  get step(): number {
    return this.clamp(this.options.step ?? this.internalStep);
  }

  get isFirst(): boolean {
    return this.step === 0;
  }

  get isLast(): boolean {
    return this.step === this.count - 1;
  }

  private clamp(index: number): number {
    return Math.min(this.count - 1, Math.max(0, Math.trunc(index)));
  }

  isDisabled(index: number): boolean {
    return Boolean(this.options.disabledSteps?.includes(index));
  }

  getStatus(index: number): StepStatus {
    if (this.errorSteps.has(index)) return 'error';
    if (index === this.step) return 'current';
    if (this.completedSteps.has(index) || index < this.step) return 'completed';
    return 'upcoming';
  }

  markCompleted(index: number, completed = true): void {
    if (completed) this.completedSteps.add(index);
    else this.completedSteps.delete(index);
  }

  markError(index: number, hasError = true): void {
    if (hasError) this.errorSteps.add(index);
    else this.errorSteps.delete(index);
  }

  goTo(index: number): void {
    const next = this.clamp(index);
    if (next === this.step || this.isDisabled(next)) return;
    if (this.options.linear && next > this.step + 1 && !this.completedSteps.has(next - 1)) return;
    if (this.options.step === undefined) this.internalStep = next;
    this.options.onStepChange?.(next);
  }

  next(): void {
    this.markCompleted(this.step, true);
    this.goTo(this.step + 1);
  }

  prev(): void {
    this.goTo(this.step - 1);
  }

  getStepTriggerProps(index: number) {
    const status = this.getStatus(index);
    const disabled = this.isDisabled(index);
    return {
      id: `${this.baseId}-step-${index}`,
      type: 'button' as const,
      disabled,
      'aria-current': status === 'current' ? ('step' as const) : undefined,
      'aria-controls': `${this.baseId}-panel-${index}`,
      'data-status': status,
      onClick: () => this.goTo(index),
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          this.goTo(index + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          this.goTo(index - 1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          this.goTo(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          this.goTo(this.count - 1);
        }
      },
    };
  }

  getPanelProps(index: number) {
    const active = index === this.step;
    return {
      id: `${this.baseId}-panel-${index}`,
      role: 'tabpanel' as const,
      'aria-labelledby': `${this.baseId}-step-${index}`,
      hidden: !active,
      'data-state': active ? ('active' as const) : ('inactive' as const),
    };
  }

  destroy(): void {
    this.completedSteps.clear();
    this.errorSteps.clear();
  }
}

export function createStepperController(options: StepperOptions): StepperController {
  return new StepperController(options);
}
