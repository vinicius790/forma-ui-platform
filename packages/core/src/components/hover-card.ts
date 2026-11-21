import { createId } from '../primitives/id';

export interface HoverCardOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export class HoverCardController {
  private options: HoverCardOptions;
  private internalOpen: boolean;
  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  readonly triggerId: string;
  readonly contentId: string;

  constructor(options: HoverCardOptions = {}) {
    this.options = { openDelay: 300, closeDelay: 200, ...options };
    this.internalOpen = options.defaultOpen ?? false;
    const base = options.id ?? createId('forma-hover-card');
    this.triggerId = `${base}-trigger`;
    this.contentId = `${base}-content`;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  updateOptions(options: Partial<HoverCardOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private clearTimers(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  setOpen(next: boolean): void {
    if (this.destroyed || this.options.disabled || next === this.open) return;
    if (this.options.open === undefined) this.internalOpen = next;
    this.options.onOpenChange?.(next);
  }

  scheduleOpen(): void {
    if (this.destroyed || this.options.disabled) return;
    this.clearTimers();
    const delay = this.options.openDelay ?? 300;
    if (delay <= 0) {
      this.setOpen(true);
      return;
    }
    this.openTimer = setTimeout(() => {
      this.openTimer = null;
      this.setOpen(true);
    }, delay);
  }

  scheduleClose(): void {
    if (this.destroyed) return;
    this.clearTimers();
    const delay = this.options.closeDelay ?? 200;
    if (delay <= 0) {
      this.setOpen(false);
      return;
    }
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.setOpen(false);
    }, delay);
  }

  getTriggerProps() {
    return {
      id: this.triggerId,
      'aria-expanded': this.open,
      'aria-controls': this.contentId,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      onPointerEnter: () => this.scheduleOpen(),
      onPointerLeave: () => this.scheduleClose(),
      onFocus: () => this.scheduleOpen(),
      onBlur: () => this.scheduleClose(),
      onKeyDown: (e: Pick<KeyboardEvent, 'key'>) => {
        if (e.key === 'Escape') {
          this.clearTimers();
          this.setOpen(false);
        }
      },
    };
  }

  getContentProps() {
    return {
      id: this.contentId,
      hidden: !this.open,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      onPointerEnter: () => this.clearTimers(),
      onPointerLeave: () => this.scheduleClose(),
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.clearTimers();
  }
}

export function createHoverCardController(options: HoverCardOptions = {}): HoverCardController {
  return new HoverCardController(options);
}
