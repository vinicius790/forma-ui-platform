export interface ReorderOptions<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  getLabel?: (item: T) => string;
  onReorder?: (nextItems: T[], fromIndex: number, toIndex: number) => void;
  onAnnounce?: (message: string) => void;
}

export function reorderArray<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length || fromIndex === toIndex) {
    return [...items];
  }
  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved!);
  return copy;
}

/**
 * Keyboard-accessible drag & reorder state machine (Space to lift/drop, Arrows to move, Escape to cancel).
 * Emits screen-reader-ready announcements without coupling to any framework or pointer library.
 */
export class ReorderController<T> {
  private options: ReorderOptions<T>;
  private list: T[];
  private grabbedIndex: number | null = null;
  private originalList: T[] | null = null;
  private lastAnnouncement = '';

  constructor(options: ReorderOptions<T>) {
    this.options = options;
    this.list = [...options.items];
  }

  get items(): readonly T[] {
    return this.list;
  }

  get activeIndex(): number | null {
    return this.grabbedIndex;
  }

  get announcement(): string {
    return this.lastAnnouncement;
  }

  private labelOf(item: T): string {
    return this.options.getLabel?.(item) ?? this.options.getKey(item);
  }

  private announce(message: string): void {
    this.lastAnnouncement = message;
    this.options.onAnnounce?.(message);
  }

  lift(index: number): void {
    if (index < 0 || index >= this.list.length) return;
    this.originalList = [...this.list];
    this.grabbedIndex = index;
    this.announce(`Picked up ${this.labelOf(this.list[index]!)}. Position ${index + 1} of ${this.list.length}.`);
  }

  moveBy(delta: number): void {
    if (this.grabbedIndex === null) return;
    const target = Math.max(0, Math.min(this.list.length - 1, this.grabbedIndex + delta));
    if (target === this.grabbedIndex) return;
    const from = this.grabbedIndex;
    this.list = reorderArray(this.list, from, target);
    this.grabbedIndex = target;
    this.options.onReorder?.([...this.list], from, target);
    this.announce(`Moved ${this.labelOf(this.list[target]!)} to position ${target + 1} of ${this.list.length}.`);
  }

  drop(): void {
    if (this.grabbedIndex === null) return;
    const item = this.list[this.grabbedIndex]!;
    const pos = this.grabbedIndex + 1;
    this.grabbedIndex = null;
    this.originalList = null;
    this.announce(`Dropped ${this.labelOf(item)} at position ${pos} of ${this.list.length}.`);
  }

  cancel(): void {
    if (this.grabbedIndex === null || !this.originalList) return;
    this.list = this.originalList;
    this.grabbedIndex = null;
    this.originalList = null;
    this.announce('Reordering cancelled.');
  }

  getItemProps(index: number) {
    const grabbed = this.grabbedIndex === index;
    return {
      tabIndex: 0,
      'aria-roledescription': 'sortable item',
      'data-grabbed': grabbed ? 'true' : 'false',
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (grabbed) this.drop();
          else this.lift(index);
        } else if (grabbed && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
          e.preventDefault();
          this.moveBy(-1);
        } else if (grabbed && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
          e.preventDefault();
          this.moveBy(1);
        } else if (grabbed && e.key === 'Escape') {
          e.preventDefault();
          this.cancel();
        }
      },
    };
  }
}

export function createReorderController<T>(options: ReorderOptions<T>): ReorderController<T> {
  return new ReorderController(options);
}
