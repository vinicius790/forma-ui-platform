export type ScrollbarVisibility = 'auto' | 'always' | 'hover' | 'scroll';

export interface ScrollMetrics {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
}

export interface ScrollThumbGeometry {
  visible: boolean;
  ratio: number;
  thumbPercent: number;
  offsetPercent: number;
}

export interface ScrollAreaOptions {
  type?: ScrollbarVisibility;
  hideDelayMs?: number;
  onVisibilityChange?: (visible: boolean) => void;
}

export function computeScrollThumb(scrollPos: number, scrollSize: number, clientSize: number): ScrollThumbGeometry {
  if (scrollSize <= clientSize || clientSize <= 0 || scrollSize <= 0) {
    return { visible: false, ratio: 1, thumbPercent: 100, offsetPercent: 0 };
  }
  const ratio = clientSize / scrollSize;
  const thumbPercent = Math.max(8, Math.min(100, ratio * 100));
  const maxScroll = scrollSize - clientSize;
  const progress = Math.max(0, Math.min(1, scrollPos / maxScroll));
  const offsetPercent = progress * (100 - thumbPercent);
  return { visible: true, ratio, thumbPercent, offsetPercent };
}

export class ScrollAreaController {
  private options: ScrollAreaOptions;
  private metrics: ScrollMetrics = { scrollTop: 0, scrollLeft: 0, scrollHeight: 0, scrollWidth: 0, clientHeight: 0, clientWidth: 0 };
  private scrollbarsVisible: boolean;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(options: ScrollAreaOptions = {}) {
    this.options = { type: 'hover', hideDelayMs: 600, ...options };
    this.scrollbarsVisible = this.options.type === 'always' || this.options.type === 'auto';
  }

  get visible(): boolean {
    return this.scrollbarsVisible;
  }

  get verticalThumb(): ScrollThumbGeometry {
    return computeScrollThumb(this.metrics.scrollTop, this.metrics.scrollHeight, this.metrics.clientHeight);
  }

  get horizontalThumb(): ScrollThumbGeometry {
    return computeScrollThumb(this.metrics.scrollLeft, this.metrics.scrollWidth, this.metrics.clientWidth);
  }

  updateMetrics(next: Partial<ScrollMetrics>): void {
    this.metrics = { ...this.metrics, ...next };
    if (this.options.type === 'scroll') this.showTemporarily();
  }

  private setVisible(next: boolean): void {
    if (this.destroyed || this.scrollbarsVisible === next) return;
    this.scrollbarsVisible = next;
    this.options.onVisibilityChange?.(next);
  }

  private showTemporarily(): void {
    if (this.destroyed) return;
    this.clearTimer();
    this.setVisible(true);
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.setVisible(false);
    }, this.options.hideDelayMs ?? 600);
  }

  private clearTimer(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  getRootProps() {
    return {
      'data-scrollbars-visible': this.scrollbarsVisible ? 'true' : 'false',
      onPointerEnter: () => {
        if (this.options.type === 'hover') {
          this.clearTimer();
          this.setVisible(true);
        }
      },
      onPointerLeave: () => {
        if (this.options.type === 'hover') this.setVisible(false);
      },
    };
  }

  getViewportProps() {
    return {
      tabIndex: 0,
      role: 'region' as const,
      'aria-label': 'Scrollable area',
      onScroll: (e: { currentTarget?: Partial<ScrollMetrics> }) => {
        if (e.currentTarget) this.updateMetrics(e.currentTarget);
      },
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.clearTimer();
  }
}

export function createScrollAreaController(options: ScrollAreaOptions = {}): ScrollAreaController {
  return new ScrollAreaController(options);
}
