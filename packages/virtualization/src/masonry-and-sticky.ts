export interface MasonryVirtualizerOptions {
  count: number;
  lanes: number;
  estimateSize: number | ((index: number) => number);
  gap?: number;
  overscan?: number;
}

export interface MasonryVirtualItem {
  readonly index: number;
  readonly lane: number;
  readonly start: number;
  readonly end: number;
  readonly size: number;
}

/**
 * Multi-lane shortest-column masonry virtualizer with dynamic measurement,
 * overscan filtering, and idempotent cleanup.
 */
export class MasonryVirtualizer {
  private options: Required<Pick<MasonryVirtualizerOptions, 'count' | 'lanes' | 'gap' | 'overscan'>> & {
    estimateSize: number | ((index: number) => number);
  };
  private sizes: Float64Array;
  private measured = new Set<number>();
  private layout: MasonryVirtualItem[] = [];
  private computedTotalSize = 0;
  private baseEstimate = 1;
  private layoutDirty = true;
  private viewportOffset = 0;
  private viewportSizeValue = 0;
  private listeners = new Set<() => void>();
  private destroyed = false;

  constructor(options: MasonryVirtualizerOptions) {
    this.options = this.normalizeOptions(options);
    this.sizes = this.buildSizes(this.options);
    this.baseEstimate = this.options.count > 0 ? this.sizes[0]! : 1;
  }

  get count(): number {
    return this.options.count;
  }

  get lanes(): number {
    return this.options.lanes;
  }

  get scrollOffset(): number {
    return this.viewportOffset;
  }

  get viewportSize(): number {
    return this.viewportSizeValue;
  }

  get totalSize(): number {
    this.ensureLayout();
    return this.computedTotalSize;
  }

  getItem(index: number): MasonryVirtualItem | undefined {
    if (!Number.isInteger(index) || index < 0 || index >= this.options.count) return undefined;
    this.ensureLayout();
    return this.layout[index];
  }

  getVirtualItems(): MasonryVirtualItem[] {
    if (this.options.count === 0 || this.viewportSizeValue <= 0) return [];
    this.ensureLayout();
    const pad = this.options.overscan * this.baseEstimate;
    const minOffset = Math.max(0, this.viewportOffset - pad);
    const maxOffset = this.viewportOffset + this.viewportSizeValue + pad;
    const visible: MasonryVirtualItem[] = [];
    for (let i = 0; i < this.layout.length; i += 1) {
      const item = this.layout[i]!;
      if (item.end > minOffset && item.start < maxOffset) {
        visible.push(item);
      }
    }
    return visible;
  }

  setViewport(offset: number, size: number): void {
    this.assertActive();
    const nextOffset = Math.max(0, Number.isFinite(offset) ? offset : 0);
    const nextSize = Math.max(0, Number.isFinite(size) ? size : 0);
    if (nextOffset === this.viewportOffset && nextSize === this.viewportSizeValue) return;
    this.viewportOffset = nextOffset;
    this.viewportSizeValue = nextSize;
    this.notify();
  }

  measure(index: number, size: number): void {
    this.assertActive();
    if (!Number.isInteger(index) || !Number.isFinite(size) || size < 0 || index < 0 || index >= this.options.count) {
      return;
    }
    const previous = this.sizes[index]!;
    if (Math.abs(previous - size) < 0.5) return;
    this.sizes[index] = size;
    this.measured.add(index);
    this.layoutDirty = true;
    this.notify();
  }

  updateOptions(options: Partial<MasonryVirtualizerOptions>): void {
    this.assertActive();
    const nextOptions = this.normalizeOptions({ ...this.options, ...options });
    const rebuildSizes = nextOptions.count !== this.options.count || options.estimateSize !== undefined;
    let nextSizes = this.sizes;
    let nextMeasured = this.measured;

    if (rebuildSizes) {
      const built = this.buildSizes(nextOptions);
      const limit = Math.min(this.sizes.length, built.length);
      for (let i = 0; i < limit; i += 1) {
        if (this.measured.has(i)) built[i] = this.sizes[i]!;
      }
      nextSizes = built;
      nextMeasured = new Set([...this.measured].filter((i) => i < nextOptions.count));
    }

    this.options = nextOptions;
    this.sizes = nextSizes;
    this.measured = nextMeasured;
    this.baseEstimate = nextOptions.count > 0 ? this.estimate(0, nextOptions) : 1;
    this.layoutDirty = true;
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.assertActive();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.listeners.clear();
    this.layout = [];
    this.measured.clear();
  }

  private normalizeOptions(
    options: MasonryVirtualizerOptions,
  ): Required<Pick<MasonryVirtualizerOptions, 'count' | 'lanes' | 'gap' | 'overscan'>> & {
    estimateSize: number | ((index: number) => number);
  } {
    const count = Math.max(0, Number.isFinite(options.count) ? Math.floor(options.count) : 0);
    const lanes = Math.max(1, Number.isFinite(options.lanes) ? Math.floor(options.lanes) : 1);
    const gap = Math.max(0, Number.isFinite(options.gap ?? 0) ? (options.gap ?? 0) : 0);
    const overscan = Math.max(0, Number.isFinite(options.overscan ?? 3) ? Math.floor(options.overscan ?? 3) : 3);
    const sampleEstimate =
      typeof options.estimateSize === 'number'
        ? options.estimateSize
        : count > 0
          ? options.estimateSize(0)
          : 1;
    if (!Number.isFinite(sampleEstimate) || sampleEstimate <= 0) {
      throw new RangeError('estimateSize must return a positive finite size.');
    }
    return { count, lanes, gap, overscan, estimateSize: options.estimateSize };
  }

  private estimate(index: number, options = this.options): number {
    const value = typeof options.estimateSize === 'function' ? options.estimateSize(index) : options.estimateSize;
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`estimateSize(${index}) must return a positive finite size.`);
    }
    return value;
  }

  private buildSizes(options: typeof this.options): Float64Array {
    const arr = new Float64Array(options.count);
    for (let i = 0; i < options.count; i += 1) {
      arr[i] = this.estimate(i, options);
    }
    return arr;
  }

  private ensureLayout(): void {
    if (!this.layoutDirty) return;
    const { count, lanes, gap } = this.options;
    if (count === 0) {
      this.layout = [];
      this.computedTotalSize = 0;
      this.layoutDirty = false;
      return;
    }

    const laneHeights = new Float64Array(lanes);
    const laneCounts = new Int32Array(lanes);
    const items: MasonryVirtualItem[] = new Array<MasonryVirtualItem>(count);

    for (let index = 0; index < count; index += 1) {
      let bestLane = 0;
      let bestHeight = laneHeights[0]!;
      for (let lane = 1; lane < lanes; lane += 1) {
        const height = laneHeights[lane]!;
        if (height < bestHeight) {
          bestHeight = height;
          bestLane = lane;
        }
      }
      const start = bestHeight + (laneCounts[bestLane]! > 0 ? gap : 0);
      const size = this.sizes[index]!;
      const end = start + size;
      laneHeights[bestLane] = end;
      laneCounts[bestLane] = laneCounts[bestLane]! + 1;
      items[index] = Object.freeze({ index, lane: bestLane, start, end, size });
    }

    let maxHeight = 0;
    for (let lane = 0; lane < lanes; lane += 1) {
      if (laneHeights[lane]! > maxHeight) maxHeight = laneHeights[lane]!;
    }
    this.layout = items;
    this.computedTotalSize = maxHeight;
    this.layoutDirty = false;
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }

  private assertActive(): void {
    if (this.destroyed) throw new Error('MasonryVirtualizer has been destroyed.');
  }
}

export function createMasonryVirtualizer(options: MasonryVirtualizerOptions): MasonryVirtualizer {
  return new MasonryVirtualizer(options);
}

/**
 * Binary-search resolver that returns the active sticky section header index
 * whose offset is less than or equal to `scrollOffset`, or `-1` when none is active.
 */
export function findActiveStickyIndex(
  stickyIndices: readonly number[],
  scrollOffset: number,
  getOffset: (index: number) => number,
): number {
  if (stickyIndices.length === 0 || !Number.isFinite(scrollOffset)) return -1;
  let low = 0;
  let high = stickyIndices.length - 1;
  let active = -1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const candidate = stickyIndices[mid]!;
    if (getOffset(candidate) <= scrollOffset) {
      active = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return active;
}
