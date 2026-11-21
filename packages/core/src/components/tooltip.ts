export interface TooltipOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  skipDelayDuration?: number;
  closeDelayDuration?: number;
  disabled?: boolean;
}

let warmUntil = 0;

export class TooltipController {
  private internalOpen: boolean;
  private openTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private triggerCleanup?: () => void;
  private contentCleanup?: () => void;
  private pointerOnTrigger = false;
  private pointerOnContent = false;
  private focused = false;
  private dismissed = false;

  constructor(private options: TooltipOptions = {}) {
    this.internalOpen = options.defaultOpen ?? false;
  }

  get open(): boolean {
    return !this.options.disabled && (this.options.open ?? this.internalOpen);
  }

  updateOptions(options: Partial<TooltipOptions>): void {
    const wasOpen = this.open;
    this.options = { ...this.options, ...options };
    if (this.options.disabled) {
      this.clearOpenTimer();
      this.clearCloseTimer();
      if (wasOpen && this.options.open !== undefined) this.options.onOpenChange?.(false);
      this.internalOpen = false;
    }
    if (wasOpen !== this.open) {
      if (this.open) warmUntil = Date.now() + (this.options.skipDelayDuration ?? 300);
      else this.clearOpenTimer();
    }
  }

  setTrigger(element: HTMLElement | null): void {
    this.triggerCleanup?.();
    this.triggerCleanup = undefined;
    if (!element) return;

    const pointerEnter = () => this.pointerEnter();
    const pointerLeave = () => this.pointerLeave();
    const focus = () => this.focus();
    const blur = () => this.blur();
    const keyDown = (event: KeyboardEvent) => this.keyDown(event);
    element.addEventListener('pointerenter', pointerEnter);
    element.addEventListener('pointerleave', pointerLeave);
    element.addEventListener('focus', focus);
    element.addEventListener('blur', blur);
    element.addEventListener('keydown', keyDown);
    this.triggerCleanup = () => {
      element.removeEventListener('pointerenter', pointerEnter);
      element.removeEventListener('pointerleave', pointerLeave);
      element.removeEventListener('focus', focus);
      element.removeEventListener('blur', blur);
      element.removeEventListener('keydown', keyDown);
    };
  }

  setContent(element: HTMLElement | null): void {
    this.contentCleanup?.();
    this.contentCleanup = undefined;
    if (!element) return;

    const pointerEnter = () => this.contentPointerEnter();
    const pointerLeave = () => this.contentPointerLeave();
    element.addEventListener('pointerenter', pointerEnter);
    element.addEventListener('pointerleave', pointerLeave);
    this.contentCleanup = () => {
      element.removeEventListener('pointerenter', pointerEnter);
      element.removeEventListener('pointerleave', pointerLeave);
    };
  }

  setOpen(open: boolean): void {
    if (this.options.disabled || this.open === open) return;
    if (this.options.open !== undefined) {
      this.options.onOpenChange?.(open);
      return;
    }
    this.internalOpen = open;
    this.options.onOpenChange?.(open);
    if (open) warmUntil = Date.now() + (this.options.skipDelayDuration ?? 300);
  }

  pointerEnter(): void {
    this.pointerOnTrigger = true;
    this.dismissed = false;
    this.clearCloseTimer();
    this.clearOpenTimer();
    if (this.options.disabled) return;

    const delay = Date.now() < warmUntil ? 0 : this.options.delayDuration ?? 500;
    this.openTimer = setTimeout(() => this.setOpen(true), delay);
  }

  pointerLeave(): void {
    this.pointerOnTrigger = false;
    this.clearOpenTimer();
    this.scheduleClose();
  }

  contentPointerEnter(): void {
    this.pointerOnContent = true;
    this.clearCloseTimer();
  }

  contentPointerLeave(): void {
    this.pointerOnContent = false;
    this.scheduleClose();
  }

  focus(): void {
    this.focused = true;
    this.dismissed = false;
    this.clearOpenTimer();
    this.clearCloseTimer();
    this.setOpen(true);
  }

  blur(): void {
    this.focused = false;
    this.scheduleClose();
  }

  keyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open) return;
    this.clearOpenTimer();
    this.clearCloseTimer();
    this.dismissed = true;
    this.setOpen(false);
  }

  getTriggerProps(id: string) {
    return {
      'aria-describedby': this.open ? id : undefined,
      onPointerEnter: () => this.pointerEnter(),
      onPointerLeave: () => this.pointerLeave(),
      onFocus: () => this.focus(),
      onBlur: () => this.blur(),
      onKeyDown: (event: KeyboardEvent) => this.keyDown(event),
    };
  }

  getContentProps(id: string) {
    return {
      id,
      role: 'tooltip',
      'data-state': this.open ? 'open' : 'closed',
      onPointerEnter: () => this.contentPointerEnter(),
      onPointerLeave: () => this.contentPointerLeave(),
    };
  }

  destroy(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
    this.triggerCleanup?.();
    this.contentCleanup?.();
    this.triggerCleanup = undefined;
    this.contentCleanup = undefined;
    this.pointerOnTrigger = false;
    this.pointerOnContent = false;
    this.focused = false;
  }

  private scheduleClose(): void {
    this.clearCloseTimer();
    if (this.focused || this.pointerOnTrigger || this.pointerOnContent || this.dismissed) return;
    this.closeTimer = setTimeout(
      () => this.setOpen(false),
      this.options.closeDelayDuration ?? 100,
    );
  }

  private clearOpenTimer(): void {
    if (this.openTimer) clearTimeout(this.openTimer);
    this.openTimer = undefined;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
  }
}

export function createTooltipController(options: TooltipOptions = {}): TooltipController {
  return new TooltipController(options);
}
