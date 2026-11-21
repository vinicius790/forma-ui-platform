export type VirtualAlignment = 'auto' | 'start' | 'center' | 'end';
export interface VirtualItem<Key = string | number> { readonly index: number; readonly key: Key; readonly start: number; readonly end: number; readonly size: number; readonly lane: number }
export interface VirtualizerOptions<Key = number> {
  count: number;
  estimateSize: number | ((index: number) => number);
  overscan?: number;
  gap?: number;
  getItemKey?: (index: number) => Key;
  horizontal?: boolean;
}
export interface VirtualRange { readonly startIndex: number; readonly endIndex: number; readonly offsetStart: number; readonly offsetEnd: number }

/** Fenwick tree gives O(log n) measured-size updates and prefix lookups. */
class FenwickTree {
  private tree: Float64Array;
  private values: Float64Array;
  constructor(count: number, initial: number | ((index: number) => number)) {
    this.tree = new Float64Array(count + 1);
    this.values = new Float64Array(count);
    for (let index = 0; index < count; index += 1) {
      const value = typeof initial === 'function' ? initial(index) : initial;
      this.values[index] = Number.isFinite(value) && value > 0 ? value : 1;
      this.tree[index + 1] = this.values[index]!;
    }
    for (let index = 1; index <= count; index += 1) {
      const parent = index + (index & -index);
      if (parent <= count) this.tree[parent] = this.tree[parent]! + this.tree[index]!;
    }
  }
  get length(): number { return this.values.length; }
  get(index: number): number { return this.values[index] ?? 0; }
  set(index: number, value: number): void {
    if (index < 0 || index >= this.values.length || !Number.isFinite(value) || value < 0) return;
    const delta = value - this.values[index]!;
    this.values[index] = value;
    for (let cursor = index + 1; cursor < this.tree.length; cursor += cursor & -cursor) this.tree[cursor] = this.tree[cursor]! + delta;
  }
  prefix(endExclusive: number): number {
    let sum = 0;
    for (let cursor = Math.max(0, Math.min(this.values.length, endExclusive)); cursor > 0; cursor -= cursor & -cursor) sum += this.tree[cursor]!;
    return sum;
  }
  total(): number { return this.prefix(this.values.length); }
}

/** Framework-neutral virtual range calculator; no DOM dependency is loaded at import time. */
export class Virtualizer<Key = number> {
  private options: VirtualizerOptions<Key>;
  private sizes: FenwickTree;
  private listeners = new Set<() => void>();
  private viewportOffset = 0;
  private viewportSizeValue = 0;
  private scrollElement?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private measured = new Set<number>();
  private cleanups: Array<() => void> = [];
  private destroyed = false;

  constructor(options: VirtualizerOptions<Key>) {
    this.options = this.normalizeOptions(options);
    this.sizes = new FenwickTree(this.options.count, (index) => this.estimate(index));
  }
  get count(): number { return this.options.count; }
  get totalSize(): number { return this.sizes.total() + Math.max(0, this.count - 1) * this.gap; }
  get scrollOffset(): number { return this.viewportOffset; }
  get viewportSize(): number { return this.viewportSizeValue; }
  getRange(): VirtualRange { return this.calculateRange(this.viewportOffset, this.viewportSizeValue); }
  getVirtualItems(): VirtualItem<Key>[] {
    const range = this.getRange();
    const items: VirtualItem<Key>[] = [];
    for (let index = range.startIndex; index <= range.endIndex && index < this.count; index += 1) {
      const start = this.offsetForIndex(index);
      const size = this.sizes.get(index);
      items.push({ index, key: this.options.getItemKey?.(index) ?? (index as Key), start, end: start + size, size, lane: 0 });
    }
    return items;
  }
  updateOptions(options: Partial<VirtualizerOptions<Key>>): void {
    this.assertActive();
    const nextOptions = this.normalizeOptions({ ...this.options, ...options });
    const rebuild = nextOptions.count !== this.count || options.estimateSize !== undefined;
    let nextSizes = this.sizes;
    let nextMeasured = this.measured;

    // Construct the next index before committing options, so a bad estimator
    // cannot leave the instance with new options and an old, inconsistent tree.
    if (rebuild) {
      const old = this.sizes;
      const measured = this.measured;
      nextSizes = new FenwickTree(nextOptions.count, (index) => this.estimate(index, nextOptions));
      for (let index = 0; index < Math.min(old.length, nextSizes.length); index += 1) {
        if (measured.has(index)) nextSizes.set(index, old.get(index));
      }
      nextMeasured = new Set([...measured].filter((index) => index < nextOptions.count));
    }

    this.options = nextOptions;
    this.sizes = nextSizes;
    this.measured = nextMeasured;
    this.notify();
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
    if (!Number.isInteger(index) || !Number.isFinite(size) || size < 0 || index < 0 || index >= this.count) return;
    const before = this.sizes.get(index);
    if (Math.abs(before - size) < 0.5) return;
    this.sizes.set(index, size);
    this.measured.add(index);
    this.notify();
  }
  getOffsetForIndex(index: number): number {
    const safeIndex = Number.isFinite(index) ? Math.floor(index) : 0;
    return this.offsetForIndex(Math.max(0, Math.min(this.count, safeIndex)));
  }
  scrollToIndex(index: number, alignment: VirtualAlignment = 'auto'): number {
    if (!this.count) return 0;
    const safeIndex = Math.max(0, Math.min(this.count - 1, Number.isFinite(index) ? Math.floor(index) : 0));
    const start = this.offsetForIndex(safeIndex);
    const end = start + this.sizes.get(safeIndex);
    let offset = this.viewportOffset;
    if (alignment === 'start') offset = start;
    else if (alignment === 'center') offset = start - (this.viewportSizeValue - (end - start)) / 2;
    else if (alignment === 'end') offset = end - this.viewportSizeValue;
    else if (start < this.viewportOffset) offset = start;
    else if (end > this.viewportOffset + this.viewportSizeValue) offset = end - this.viewportSizeValue;
    return Math.max(0, Math.min(Math.max(0, this.totalSize - this.viewportSizeValue), offset));
  }
  subscribe(listener: () => void): () => void { this.assertActive(); this.listeners.add(listener); return () => this.listeners.delete(listener); }
  attach(element: HTMLElement): () => void {
    this.assertActive();
    this.detach();
    this.scrollElement = element;
    const horizontal = Boolean(this.options.horizontal);
    const update = () => this.setViewport(horizontal ? element.scrollLeft : element.scrollTop, horizontal ? element.clientWidth : element.clientHeight);
    const onScroll = () => update();
    element.addEventListener('scroll', onScroll, { passive: true });
    const ResizeObserverCtor = element.ownerDocument.defaultView?.ResizeObserver;
    const observer = ResizeObserverCtor ? new ResizeObserverCtor(update) : undefined;
    if (observer) {
      this.resizeObserver = observer;
      observer.observe(element);
    }
    update();
    const cleanup = () => {
      element.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      if (this.resizeObserver === observer) this.resizeObserver = undefined;
      if (this.scrollElement === element) this.scrollElement = undefined;
    };
    this.cleanups.push(cleanup);
    return cleanup;
  }
  scrollToOffset(offset: number): void {
    this.assertActive();
    if (!this.scrollElement) return;
    const safe = Math.max(0, Number.isFinite(offset) ? offset : 0);
    this.scrollElement.scrollTo(this.options.horizontal ? { left: safe, behavior: 'auto' } : { top: safe, behavior: 'auto' });
  }
  detach(): void { for (const cleanup of this.cleanups.splice(0).reverse()) cleanup(); }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detach();
    this.listeners.clear();
  }

  private get gap(): number { return Math.max(0, this.options.gap ?? 0); }
  private normalizeOptions(options: VirtualizerOptions<Key>): VirtualizerOptions<Key> {
    const count = Math.max(0, Math.floor(Number.isFinite(options.count) ? options.count : 0));
    const estimate = typeof options.estimateSize === 'number' ? options.estimateSize : count > 0 ? this.estimate(0, options) : 1;
    if (!Number.isFinite(estimate) || estimate <= 0) throw new RangeError('estimateSize must return a positive finite size.');
    return { ...options, count, overscan: Math.max(0, Math.floor(options.overscan ?? 3)), gap: Math.max(0, options.gap ?? 0) };
  }
  private estimate(index: number, options: VirtualizerOptions<Key> = this.options): number {
    const value = typeof options.estimateSize === 'function' ? options.estimateSize(index) : options.estimateSize;
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`estimateSize(${index}) must return a positive finite size.`);
    return value;
  }
  private offsetForIndex(index: number): number { return this.sizes.prefix(index) + Math.min(index, Math.max(0, this.count - 1)) * this.gap; }
  private calculateRange(offset: number, viewport: number): VirtualRange {
    if (!this.count || viewport <= 0) return { startIndex: 0, endIndex: -1, offsetStart: 0, offsetEnd: 0 };
    const over = this.options.overscan ?? 3;
    const first = this.findIndexAtOffset(Math.max(0, offset - over * this.estimate(0)));
    const last = this.findIndexAtOffset(Math.max(0, offset + viewport + over * this.estimate(0)));
    const startIndex = Math.max(0, first - over);
    const endIndex = Math.min(this.count - 1, last + over);
    return { startIndex, endIndex, offsetStart: this.offsetForIndex(startIndex), offsetEnd: Math.min(this.totalSize, this.offsetForIndex(endIndex + 1)) };
  }
  private findIndexAtOffset(offset: number): number {
    let low = 0;
    let high = this.count - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const end = this.offsetForIndex(middle) + this.sizes.get(middle);
      if (end <= offset) low = middle + 1; else high = middle;
    }
    return low;
  }
  private notify(): void { for (const listener of [...this.listeners]) listener(); }
  private assertActive(): void { if (this.destroyed) throw new Error('Virtualizer has been destroyed.'); }
}

export function createVirtualizer<Key = number>(options: VirtualizerOptions<Key>): Virtualizer<Key> { return new Virtualizer(options); }

export * from './grid-virtualizer';
export * from './masonry-and-sticky';
