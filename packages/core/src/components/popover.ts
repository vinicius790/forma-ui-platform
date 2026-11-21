import { createId } from '../primitives/id';
import { DismissableLayer } from '../primitives/dismissable-layer';
import { FocusTrap } from '../primitives/focus';

export interface PopoverOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export class PopoverController {
  private options: PopoverOptions;
  private internalOpen: boolean;
  private cleanupDismiss: (() => void) | null = null;
  private cleanupFocus: (() => void) | null = null;
  private destroyed = false;
  readonly triggerId: string;
  readonly contentId: string;

  constructor(options: PopoverOptions = {}) {
    this.options = { modal: false, closeOnEscape: true, closeOnOutsideClick: true, ...options };
    this.internalOpen = options.defaultOpen ?? false;
    const base = options.id ?? createId('forma-popover');
    this.triggerId = `${base}-trigger`;
    this.contentId = `${base}-content`;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  updateOptions(options: Partial<PopoverOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setOpen(next: boolean): void {
    if (this.destroyed || next === this.open) return;
    if (this.options.open === undefined) this.internalOpen = next;
    if (!next) this.detach();
    this.options.onOpenChange?.(next);
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  close(): void {
    this.setOpen(false);
  }

  attachContent(element: HTMLElement | null): () => void {
    this.detach();
    if (!element || !this.open || this.destroyed) return () => {};
    const layer = new DismissableLayer({
      element,
      dismissOnEscape: this.options.closeOnEscape ?? true,
      dismissOnOutsidePointer: this.options.closeOnOutsideClick ?? true,
      onDismiss: () => this.close(),
    });
    this.cleanupDismiss = layer.mount();
    if (this.options.modal) {
      const trap = new FocusTrap(element);
      trap.activate();
      this.cleanupFocus = () => trap.deactivate();
    }
    return () => this.detach();
  }

  detach(): void {
    this.cleanupFocus?.();
    this.cleanupFocus = null;
    this.cleanupDismiss?.();
    this.cleanupDismiss = null;
  }

  getTriggerProps() {
    return {
      id: this.triggerId,
      type: 'button' as const,
      'aria-haspopup': 'dialog' as const,
      'aria-expanded': this.open,
      'aria-controls': this.contentId,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      onClick: () => this.toggle(),
    };
  }

  getContentProps() {
    return {
      id: this.contentId,
      role: 'dialog' as const,
      'aria-modal': this.options.modal ? ('true' as const) : undefined,
      'aria-labelledby': this.triggerId,
      hidden: !this.open,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
    };
  }

  getCloseProps() {
    return {
      type: 'button' as const,
      onClick: () => this.close(),
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.detach();
  }
}

export function createPopoverController(options: PopoverOptions = {}): PopoverController {
  return new PopoverController(options);
}
