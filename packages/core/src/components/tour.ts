import { createId } from '../primitives/id';

export interface TourStep {
  id: string;
  title: string;
  description?: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface TourOptions {
  id?: string;
  steps: readonly TourStep[];
  open?: boolean;
  defaultOpen?: boolean;
  stepIndex?: number;
  defaultStepIndex?: number;
  closeOnEscape?: boolean;
  onOpenChange?: (open: boolean) => void;
  onStepChange?: (index: number, step: TourStep) => void;
  onComplete?: () => void;
  onSkip?: (index: number) => void;
}

export class TourController {
  private options: TourOptions;
  private internalOpen: boolean;
  private internalIndex: number;
  private destroyed = false;
  readonly baseId: string;

  constructor(options: TourOptions) {
    this.options = { closeOnEscape: true, ...options };
    this.internalOpen = options.defaultOpen ?? false;
    this.internalIndex = this.clamp(options.defaultStepIndex ?? 0);
    this.baseId = options.id ?? createId('forma-tour');
  }

  get steps(): readonly TourStep[] {
    return this.options.steps;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  get stepIndex(): number {
    return this.clamp(this.options.stepIndex ?? this.internalIndex);
  }

  get currentStep(): TourStep | undefined {
    return this.steps[this.stepIndex];
  }

  get progress(): number {
    return this.steps.length ? (this.stepIndex + 1) / this.steps.length : 0;
  }

  private clamp(idx: number): number {
    if (this.steps.length === 0) return 0;
    return Math.min(this.steps.length - 1, Math.max(0, Math.trunc(idx)));
  }

  start(atIndex = 0): void {
    if (this.destroyed || this.steps.length === 0) return;
    this.goTo(atIndex);
    this.setOpen(true);
  }

  setOpen(next: boolean): void {
    if (this.destroyed || next === this.open) return;
    if (this.options.open === undefined) this.internalOpen = next;
    this.options.onOpenChange?.(next);
  }

  goTo(index: number): void {
    if (this.destroyed || this.steps.length === 0) return;
    const target = this.clamp(index);
    if (this.options.stepIndex === undefined) this.internalIndex = target;
    const step = this.steps[target];
    if (step) this.options.onStepChange?.(target, step);
  }

  next(): void {
    if (this.stepIndex >= this.steps.length - 1) {
      this.setOpen(false);
      this.options.onComplete?.();
      return;
    }
    this.goTo(this.stepIndex + 1);
  }

  prev(): void {
    this.goTo(this.stepIndex - 1);
  }

  skip(): void {
    const idx = this.stepIndex;
    this.setOpen(false);
    this.options.onSkip?.(idx);
  }

  getDialogProps() {
    return {
      id: `${this.baseId}-dialog`,
      role: 'dialog' as const,
      'aria-modal': 'false' as const,
      'aria-labelledby': `${this.baseId}-title`,
      'aria-describedby': `${this.baseId}-description`,
      hidden: !this.open,
      'data-step': this.currentStep?.id,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'Escape' && (this.options.closeOnEscape ?? true)) {
          e.preventDefault();
          this.skip();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        }
      },
    };
  }

  getTitleProps() {
    return { id: `${this.baseId}-title` };
  }

  getDescriptionProps() {
    return { id: `${this.baseId}-description` };
  }

  destroy(): void {
    this.destroyed = true;
  }
}

export function createTourController(options: TourOptions): TourController {
  return new TourController(options);
}
