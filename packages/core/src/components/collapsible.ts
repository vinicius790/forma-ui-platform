import { createId } from '../primitives/id';

export interface CollapsibleOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export class CollapsibleController {
  private options: CollapsibleOptions;
  private internalOpen: boolean;
  readonly contentId: string;
  readonly triggerId: string;

  constructor(options: CollapsibleOptions = {}) {
    this.options = { ...options };
    this.internalOpen = options.defaultOpen ?? false;
    const base = options.id ?? createId('forma-collapsible');
    this.triggerId = `${base}-trigger`;
    this.contentId = `${base}-content`;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  get disabled(): boolean {
    return Boolean(this.options.disabled);
  }

  updateOptions(options: Partial<CollapsibleOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setOpen(next: boolean): void {
    if (this.disabled || next === this.open) return;
    if (this.options.open === undefined) this.internalOpen = next;
    this.options.onOpenChange?.(next);
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  getTriggerProps() {
    return {
      id: this.triggerId,
      type: 'button' as const,
      disabled: this.disabled,
      'aria-expanded': this.open,
      'aria-controls': this.contentId,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      'data-disabled': this.disabled ? '' : undefined,
      onClick: () => this.toggle(),
    };
  }

  getContentProps() {
    return {
      id: this.contentId,
      hidden: !this.open,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      'data-disabled': this.disabled ? '' : undefined,
    };
  }

  destroy(): void {
    // Idempotent cleanup hook for adapter symmetry
  }
}

export function createCollapsibleController(options: CollapsibleOptions = {}): CollapsibleController {
  return new CollapsibleController(options);
}
