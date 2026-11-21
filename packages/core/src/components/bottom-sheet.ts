import { createId } from '../primitives/id';
import { ariaHideOutside } from '../primitives/aria-hide-outside';
import { DismissableLayer } from '../primitives/dismissable-layer';
import { FocusTrap } from '../primitives/focus';
import { lockScroll } from '../primitives/scroll-lock';

export interface BottomSheetOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  snapPoints?: readonly number[];
  snapIndex?: number;
  defaultSnapIndex?: number;
  modal?: boolean;
  dismissible?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSnapIndexChange?: (index: number, snapPoint: number) => void;
}

export class BottomSheetController {
  private options: BottomSheetOptions;
  private internalOpen: boolean;
  private internalSnap: number;
  private cleanups: Array<() => void> = [];
  private destroyed = false;
  readonly baseId: string;

  constructor(options: BottomSheetOptions = {}) {
    const snaps = options.snapPoints && options.snapPoints.length > 0 ? [...options.snapPoints].sort((a, b) => a - b) : [0.35, 0.75, 0.95];
    this.options = { modal: true, dismissible: true, ...options, snapPoints: snaps };
    this.internalOpen = options.defaultOpen ?? false;
    this.internalSnap = this.clampSnap(options.defaultSnapIndex ?? 0);
    this.baseId = options.id ?? createId('forma-sheet');
  }

  get snapPoints(): readonly number[] {
    return this.options.snapPoints ?? [0.35, 0.75, 0.95];
  }

  get open(): boolean {
    return this.options.open ?? this.internalOpen;
  }

  get snapIndex(): number {
    return this.clampSnap(this.options.snapIndex ?? this.internalSnap);
  }

  get snapPoint(): number {
    return this.snapPoints[this.snapIndex] ?? 0.5;
  }

  private clampSnap(idx: number): number {
    return Math.min(this.snapPoints.length - 1, Math.max(0, Math.trunc(idx)));
  }

  setOpen(next: boolean): void {
    if (this.destroyed || next === this.open) return;
    if (this.options.open === undefined) this.internalOpen = next;
    if (!next) this.detach();
    this.options.onOpenChange?.(next);
  }

  close(): void {
    if (this.options.dismissible === false) return;
    this.setOpen(false);
  }

  snapTo(index: number): void {
    if (this.destroyed) return;
    const clamped = this.clampSnap(index);
    if (clamped === this.snapIndex) return;
    if (this.options.snapIndex === undefined) this.internalSnap = clamped;
    this.options.onSnapIndexChange?.(clamped, this.snapPoints[clamped]!);
  }

  /** Resolves drag release ratio (0..1) + downward velocity into closest snap point or dismiss. */
  resolveDragRelease(currentRatio: number, velocityY = 0): void {
    if (velocityY > 0.8 && (this.options.dismissible ?? true)) {
      this.close();
      return;
    }
    if (currentRatio < (this.snapPoints[0]! * 0.5) && (this.options.dismissible ?? true)) {
      this.close();
      return;
    }
    let bestIdx = 0;
    let bestDist = Infinity;
    this.snapPoints.forEach((pt, idx) => {
      const dist = Math.abs(pt - currentRatio);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    this.snapTo(bestIdx);
  }

  attachSheet(element: HTMLElement | null): () => void {
    this.detach();
    if (!element || !this.open || this.destroyed) return () => {};
    const layer = new DismissableLayer({
      element,
      dismissOnEscape: this.options.dismissible ?? true,
      dismissOnOutsidePointer: this.options.dismissible ?? true,
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
    while (this.cleanups.length > 0) this.cleanups.pop()?.();
  }

  getSheetProps() {
    return {
      id: `${this.baseId}-sheet`,
      role: 'dialog' as const,
      'aria-modal': (this.options.modal ?? true) ? ('true' as const) : undefined,
      'aria-labelledby': `${this.baseId}-title`,
      hidden: !this.open,
      'data-state': this.open ? ('open' as const) : ('closed' as const),
      'data-snap-index': this.snapIndex,
      'data-snap-point': this.snapPoint,
    };
  }

  getDragHandleProps() {
    return {
      role: 'slider' as const,
      tabIndex: 0,
      'aria-label': 'Sheet height',
      'aria-orientation': 'vertical' as const,
      'aria-valuemin': 0,
      'aria-valuemax': this.snapPoints.length - 1,
      'aria-valuenow': this.snapIndex,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); this.snapTo(this.snapIndex + 1); }
        else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.snapIndex === 0) this.close();
          else this.snapTo(this.snapIndex - 1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.close();
        }
      },
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.detach();
  }
}

export function createBottomSheetController(options: BottomSheetOptions = {}): BottomSheetController {
  return new BottomSheetController(options);
}
