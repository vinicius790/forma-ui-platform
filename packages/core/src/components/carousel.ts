import { createId } from '../primitives/id';
import { prefersReducedMotion } from '../primitives/media-query';

export interface CarouselOptions {
  id?: string;
  slideCount: number;
  index?: number;
  defaultIndex?: number;
  loop?: boolean;
  autoplayMs?: number;
  onIndexChange?: (index: number) => void;
}

export class CarouselController {
  private options: CarouselOptions;
  private internalIndex: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private destroyed = false;
  readonly baseId: string;

  constructor(options: CarouselOptions) {
    this.options = { loop: true, ...options };
    this.internalIndex = this.normalize(options.defaultIndex ?? 0);
    this.baseId = options.id ?? createId('forma-carousel');
  }

  get slideCount(): number {
    return Math.max(1, this.options.slideCount);
  }

  get index(): number {
    return this.normalize(this.options.index ?? this.internalIndex);
  }

  get isPlaying(): boolean {
    return this.timer !== null && !this.paused;
  }

  private normalize(next: number): number {
    const count = this.slideCount;
    if (this.options.loop ?? true) return ((next % count) + count) % count;
    return Math.min(count - 1, Math.max(0, next));
  }

  goTo(next: number): void {
    if (this.destroyed) return;
    const target = this.normalize(next);
    if (target === this.index) return;
    if (this.options.index === undefined) this.internalIndex = target;
    this.options.onIndexChange?.(target);
  }

  next(): void {
    this.goTo(this.index + 1);
  }

  prev(): void {
    this.goTo(this.index - 1);
  }

  startAutoplay(): void {
    const ms = this.options.autoplayMs ?? 0;
    if (this.destroyed || ms <= 0 || prefersReducedMotion()) return;
    this.stopAutoplay();
    this.paused = false;
    this.timer = setInterval(() => {
      if (!this.paused) this.next();
    }, ms);
  }

  pauseAutoplay(): void {
    this.paused = true;
  }

  stopAutoplay(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getRootProps() {
    return {
      id: this.baseId,
      role: 'region' as const,
      'aria-roledescription': 'carousel',
      onPointerEnter: () => this.pauseAutoplay(),
      onFocusIn: () => this.pauseAutoplay(),
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        } else if (e.key === 'Home') {
          e.preventDefault();
          this.goTo(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          this.goTo(this.slideCount - 1);
        }
      },
    };
  }

  getSlideProps(slideIndex: number) {
    const active = slideIndex === this.index;
    return {
      id: `${this.baseId}-slide-${slideIndex}`,
      role: 'group' as const,
      'aria-roledescription': 'slide',
      'aria-label': `${slideIndex + 1} of ${this.slideCount}`,
      'aria-hidden': !active,
      'data-active': active ? 'true' : 'false',
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.stopAutoplay();
  }
}

export function createCarouselController(options: CarouselOptions): CarouselController {
  return new CarouselController(options);
}
