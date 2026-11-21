import { createId } from '../primitives/id';
import { DismissableLayer } from '../primitives/dismissable-layer';

export interface ContextMenuPoint {
  x: number;
  y: number;
}

export interface ContextMenuOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export class ContextMenuController {
  private options: ContextMenuOptions;
  private internalOpen: boolean;
  private anchorPoint: ContextMenuPoint = { x: 0, y: 0 };
  private cleanupLayer: (() => void) | null = null;
  private destroyed = false;
  readonly menuId: string;

  constructor(options: ContextMenuOptions = {}) {
    this.options = { ...options };
    this.internalOpen = options.defaultOpen ?? false;
    this.menuId = `${options.id ?? createId('forma-context-menu')}-menu`;
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  get point(): ContextMenuPoint {
    return { ...this.anchorPoint };
  }

  updateOptions(options: Partial<ContextMenuOptions>): void {
    this.options = { ...this.options, ...options };
  }

  openAt(x: number, y: number): void {
    if (this.destroyed || this.options.disabled) return;
    this.anchorPoint = { x, y };
    this.setOpen(true);
  }

  setOpen(next: boolean): void {
    if (this.destroyed || (next && this.options.disabled) || next === this.open) return;
    if (this.options.open === undefined) this.internalOpen = next;
    if (!next) this.detach();
    this.options.onOpenChange?.(next);
  }

  close(): void {
    this.setOpen(false);
  }

  attachMenu(element: HTMLElement | null): () => void {
    this.detach();
    if (!element || !this.open || this.destroyed) return () => {};
    const layer = new DismissableLayer({
      element,
      dismissOnEscape: true,
      dismissOnOutsidePointer: true,
      onDismiss: () => this.close(),
    });
    this.cleanupLayer = layer.mount();
    return () => this.detach();
  }

  detach(): void {
    this.cleanupLayer?.();
    this.cleanupLayer = null;
  }

  getTriggerProps() {
    return {
      'aria-haspopup': 'menu' as const,
      'aria-expanded': this.open,
      'aria-controls': this.menuId,
      onContextMenu: (e: Pick<MouseEvent, 'clientX' | 'clientY' | 'preventDefault'>) => {
        if (this.options.disabled) return;
        e.preventDefault();
        this.openAt(e.clientX, e.clientY);
      },
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'>) => {
        if (this.options.disabled) return;
        if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
          e.preventDefault();
          this.setOpen(true);
        }
      },
    };
  }

  getMenuProps() {
    return {
      id: this.menuId,
      role: 'menu' as const,
      hidden: !this.open,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      'data-anchor-x': this.anchorPoint.x,
      'data-anchor-y': this.anchorPoint.y,
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.detach();
  }
}

export function createContextMenuController(options: ContextMenuOptions = {}): ContextMenuController {
  return new ContextMenuController(options);
}
