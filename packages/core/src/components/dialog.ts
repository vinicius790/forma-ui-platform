import { ariaHideOutside } from '../primitives/aria-hide-outside';
import { DismissableLayer } from '../primitives/dismissable-layer';
import { FocusTrap } from '../primitives/focus';
import { createPortal } from '../primitives/portal';
import { lockScroll } from '../primitives/scroll-lock';

export interface DialogOptions {
  role?: 'dialog' | 'alertdialog';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnEscape?: boolean;
  closeOnOutsidePointer?: boolean;
  modal?: boolean;
  trapFocus?: boolean;
  portalContainer?: HTMLElement | null;
}

export class DialogController {
  private internalOpen: boolean;
  private trigger: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private focusTrap: FocusTrap | null = null;
  private cleanups: Array<() => void> = [];
  private portal: ReturnType<typeof createPortal> = null;
  private restoreTriggerOnClose = true;

  constructor(private options: DialogOptions = {}) {
    this.internalOpen = options.defaultOpen ?? false;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  updateOptions(options: Partial<DialogOptions>): void {
    const wasOpen = this.open;
    const previousOptions = this.options;
    this.options = { ...this.options, ...options };
    if (wasOpen !== this.open) {
      if (this.open) {
        this.restoreTriggerOnClose = true;
        this.activate();
      } else {
        this.deactivate(this.restoreTriggerOnClose);
      }
    } else if (this.open && (previousOptions.modal !== this.options.modal
      || previousOptions.closeOnEscape !== this.options.closeOnEscape
      || previousOptions.closeOnOutsidePointer !== this.options.closeOnOutsidePointer
      || previousOptions.trapFocus !== this.options.trapFocus)) {
      this.deactivate();
      this.activate();
    }
  }

  setOpen(open: boolean): void {
    if (open) this.restoreTriggerOnClose = true;
    if (this.open === open) return;
    if (this.options.open !== undefined) {
      this.options.onOpenChange?.(open);
      return;
    }
    this.internalOpen = open;
    this.options.onOpenChange?.(open);
    if (open) this.activate();
    else this.deactivate(this.restoreTriggerOnClose);
  }

  show(): void {
    this.setOpen(true);
  }

  close(restoreFocus = true): void {
    this.restoreTriggerOnClose = restoreFocus;
    this.setOpen(false);
  }

  setTrigger(element: HTMLElement | null): void {
    this.trigger = element;
  }

  setContent(element: HTMLElement | null): void {
    if (this.content === element) return;
    this.deactivate(false);
    this.content = element;
    if (this.open && element) this.activate();
  }

  getTriggerProps(contentId?: string) {
    return {
      type: 'button' as const,
      'aria-haspopup': 'dialog' as const,
      'aria-expanded': this.open,
      'aria-controls': contentId,
      onClick: () => this.setOpen(!this.open),
    };
  }

  getContentProps(titleId?: string, descriptionId?: string) {
    return {
      role: this.options.role ?? 'dialog',
      'aria-modal': this.options.modal === false ? undefined : true,
      'aria-labelledby': titleId,
      'aria-describedby': descriptionId,
      tabIndex: -1,
      'data-state': this.open ? 'open' : 'closed',
    };
  }

  mountPortal(): HTMLElement | null {
    if (!this.portal) {
      this.portal = createPortal({ container: this.options.portalContainer });
    }
    return this.portal?.element ?? null;
  }

  destroyPortal(): void {
    this.portal?.destroy();
    this.portal = null;
  }

  destroy(): void {
    this.deactivate(this.open && this.restoreTriggerOnClose);
    this.content = null;
    this.trigger = null;
    this.destroyPortal();
  }

  private activate(): void {
    if (!this.content || this.cleanups.length > 0) return;

    const shouldTrapFocus = this.options.trapFocus ?? this.options.modal !== false;
    if (shouldTrapFocus) {
      this.focusTrap = new FocusTrap(this.content);
      this.focusTrap.activate();
    }

    if (this.options.modal !== false) {
      this.cleanups.push(lockScroll(this.content.ownerDocument.body));
      this.cleanups.push(ariaHideOutside(this.content));
    }

    const layer = new DismissableLayer({
      element: this.content,
      dismissOnEscape: this.options.closeOnEscape !== false,
      dismissOnOutsidePointer: this.options.closeOnOutsidePointer === true,
      onDismiss: (reason) => this.close(reason !== 'outside-pointer'),
    });
    this.cleanups.push(layer.mount());
  }

  private deactivate(restoreFocus = false): void {
    const shouldRestoreTrigger = restoreFocus;
    const hadFocusTrap = Boolean(this.focusTrap);
    this.focusTrap?.deactivate(shouldRestoreTrigger);
    this.focusTrap = null;
    for (const cleanup of this.cleanups.splice(0).reverse()) cleanup();
    if (shouldRestoreTrigger && !hadFocusTrap) this.trigger?.focus({ preventScroll: true });
  }
}

export function createDialogController(options: DialogOptions = {}): DialogController {
  return new DialogController(options);
}

/** AlertDialog shares Dialog's modal behavior but exposes the alertdialog role. */
export function createAlertDialogController(options: Omit<DialogOptions, 'role'> = {}): DialogController {
  return new DialogController({ ...options, role: 'alertdialog', modal: options.modal ?? true });
}
