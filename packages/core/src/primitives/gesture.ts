export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface GesturePoint {
  x: number;
  y: number;
  time?: number;
}

export interface GestureOptions {
  swipeThresholdPx?: number;
  longPressMs?: number;
  onSwipe?: (direction: SwipeDirection, distance: number, velocity: number) => void;
  onLongPress?: (point: GesturePoint) => void;
}

export function computePinchDistance(p1: GesturePoint, p2: GesturePoint): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/** Headless pointer gesture recognizer (swipe + cancellable long-press) with zero DOM leaks. */
export class GestureController {
  private options: GestureOptions;
  private startPoint: GesturePoint | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(options: GestureOptions = {}) {
    this.options = { swipeThresholdPx: 40, longPressMs: 500, ...options };
  }

  private clearTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  pointerDown(point: GesturePoint): void {
    if (this.destroyed) return;
    this.clearTimer();
    const stamped = { x: point.x, y: point.y, time: point.time ?? Date.now() };
    this.startPoint = stamped;
    if (this.options.onLongPress) {
      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        if (!this.destroyed && this.startPoint) this.options.onLongPress?.(stamped);
      }, this.options.longPressMs ?? 500);
    }
  }

  pointerMove(point: GesturePoint): void {
    if (!this.startPoint) return;
    if (Math.hypot(point.x - this.startPoint.x, point.y - this.startPoint.y) > 10) {
      this.clearTimer();
    }
  }

  pointerUp(point: GesturePoint): SwipeDirection | null {
    this.clearTimer();
    if (!this.startPoint || this.destroyed) return null;
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;
    const dt = Math.max(1, (point.time ?? Date.now()) - (this.startPoint.time ?? 0));
    this.startPoint = null;
    const threshold = this.options.swipeThresholdPx ?? 40;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < threshold) return null;
    const direction: SwipeDirection = absX >= absY ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const distance = Math.max(absX, absY);
    const velocity = distance / dt;
    this.options.onSwipe?.(direction, distance, velocity);
    return direction;
  }

  cancel(): void {
    this.clearTimer();
    this.startPoint = null;
  }

  destroy(): void {
    this.destroyed = true;
    this.cancel();
  }
}

export function createGestureController(options: GestureOptions = {}): GestureController {
  return new GestureController(options);
}
