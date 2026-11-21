import { createId } from '../primitives/id';
import { ariaHideOutside } from '../primitives/aria-hide-outside';
import { DismissableLayer } from '../primitives/dismissable-layer';
import { FocusTrap } from '../primitives/focus';
import { lockScroll } from '../primitives/scroll-lock';

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  placement?: DrawerPlacement;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export class DrawerController {
  private options: DrawerOptions;
  private internalOpen: boolean;
  private cleanups: Array<() => void> = [];
  private destroyed = false;
  readonly contentId: string;
  readonly titleId: string;
  readonly descriptionId: string;

  constructor(options: DrawerOptions = {}) {
    this.options = {
      placement: 'right',
      modal: true,
      closeOnEscape: true,
      closeOnOutsideClick: true,
      ...options,
    };
    this.internalOpen = options.defaultOpen ?? false;
    const base = options.id ?? createId('forma-drawer');
    this.contentId = `${base}-content`;
    this.titleId = `${base}-title`;
    this.descriptionId = `${base}-description`;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  get placement(): DrawerPlacement {
    return this.options.placement ?? 'right';
  }

  updateOptions(options: Partial<DrawerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setOpen(next: boolean): void {
    if (this.destroyed || next === this.open) return;
    if (this.options.open === undefined) this.internalOpen = next;
    if (!next) this.detach();
    this.options.onOpenChange?.(next);
  }

  close(): void {
    this.setOpen(false);
  }

  toggle(): void {
    this.setOpen(!this.open);
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
    this.cleanups.push(layer.mount());

    if (this.options.modal ?? true) {
      const releaseScroll = lockScroll(element.ownerDocument.body);
      const restoreOutside = ariaHideOutside(element);
      const trap = new FocusTrap(element);
      trap.activate();
      this.cleanups.push(() => trap.deactivate(), restoreOutside, releaseScroll);
    }
    return () => this.detach();
  }

  detach(): void {
    while (this.cleanups.length > 0) {
      const fn = this.cleanups.pop();
      fn?.();
    }
  }

  getTriggerProps() {
    return {
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
      'aria-modal': (this.options.modal ?? true) ? ('true' as const) : undefined,
      'aria-labelledby': this.titleId,
      'aria-describedby': this.descriptionId,
      hidden: !this.open,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      'data-placement': this.placement,
    };
  }

  getTitleProps() {
    return { id: this.titleId };
  }

  getDescriptionProps() {
    return { id: this.descriptionId };
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

export function createDrawerController(options: DrawerOptions = {}): DrawerController {
  return new DrawerController(options);
}
