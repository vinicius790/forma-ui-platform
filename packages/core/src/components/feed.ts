import { createId } from '../primitives/id';

export interface FeedOptions {
  id?: string;
  count: number;
  setSize?: number;
  busy?: boolean;
  defaultFocusedIndex?: number;
  onFocusedIndexChange?: (index: number) => void;
  onExitBefore?: () => void;
  onExitAfter?: () => void;
}

export class FeedController {
  private options: FeedOptions;
  private internalIndex: number;
  readonly baseId: string;

  constructor(options: FeedOptions) {
    this.options = { ...options };
    this.internalIndex = this.clamp(options.defaultFocusedIndex ?? 0);
    this.baseId = options.id ?? createId('forma-feed');
  }

  get count(): number {
    return Math.max(0, Math.trunc(this.options.count));
  }

  get busy(): boolean {
    return Boolean(this.options.busy);
  }

  get focusedIndex(): number {
    return this.clamp(this.internalIndex);
  }

  private clamp(idx: number): number {
    if (this.count === 0) return 0;
    return Math.min(this.count - 1, Math.max(0, Math.trunc(idx)));
  }

  updateOptions(options: Partial<FeedOptions>): void {
    this.options = { ...this.options, ...options };
  }

  focusIndex(index: number): void {
    if (this.count === 0) return;
    const next = this.clamp(index);
    if (next === this.internalIndex) return;
    this.internalIndex = next;
    this.options.onFocusedIndexChange?.(next);
  }

  getFeedProps(label = 'Activity feed') {
    return {
      id: this.baseId,
      role: 'feed' as const,
      'aria-label': label,
      'aria-busy': this.busy,
      'data-loading': this.busy ? 'true' : undefined,
    };
  }

  getArticleProps(index: number) {
    return {
      id: `${this.baseId}-article-${index}`,
      role: 'article' as const,
      tabIndex: this.focusedIndex === index ? 0 : -1,
      'aria-posinset': index + 1,
      'aria-setsize': this.options.setSize ?? -1,
      onFocus: () => this.focusIndex(index),
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'preventDefault'>) => {
        if (e.key === 'PageDown') {
          e.preventDefault();
          this.focusIndex(index + 1);
        } else if (e.key === 'PageUp') {
          e.preventDefault();
          this.focusIndex(index - 1);
        } else if (e.ctrlKey && e.key === 'Home') {
          e.preventDefault();
          this.options.onExitBefore?.();
        } else if (e.ctrlKey && e.key === 'End') {
          e.preventDefault();
          this.options.onExitAfter?.();
        }
      },
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createFeedController(options: FeedOptions): FeedController {
  return new FeedController(options);
}
