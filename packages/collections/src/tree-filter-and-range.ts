/**
 * Filters a nested tree while preserving every ancestor chain leading to a matching descendant.
 * Returns new cloned nodes without mutating the input tree.
 */
export function filterTreePreservingAncestors<T extends { id: string; children?: readonly T[] }>(
  nodes: readonly T[],
  predicate: (node: T) => boolean,
): T[] {
  const ancestors = new Set<string>();

  const walk = (list: readonly T[]): T[] => {
    const filtered: T[] = [];
    for (const node of list) {
      if (ancestors.has(node.id)) continue;
      ancestors.add(node.id);
      const matchingChildren = node.children ? walk(node.children) : undefined;
      ancestors.delete(node.id);

      const selfMatches = predicate(node);
      if (selfMatches || (matchingChildren && matchingChildren.length > 0)) {
        if (node.children !== undefined) {
          filtered.push({ ...node, children: matchingChildren ?? [] } as T);
        } else {
          filtered.push({ ...node });
        }
      }
    }
    return filtered;
  };

  return walk(nodes);
}

export interface RangeSelectionOptions {
  /** When true, Shift-range unions with existing selection instead of replacing it. Default: false. */
  additive?: boolean;
}

/**
 * Multi-item selection controller supporting single select, toggle multi-select,
 * and Shift-range selection with deterministic anchor tracking.
 */
export class RangeSelectionController {
  private orderedKeys: string[] = [];
  private keyIndex = new Map<string, number>();
  private selected = new Set<string>();
  private anchor: string | null = null;
  private focus: string | null = null;
  private listeners = new Set<() => void>();
  private destroyed = false;

  constructor(keys: readonly string[] = []) {
    this.setKeys(keys);
  }

  get selectedKeys(): readonly string[] {
    return this.orderedKeys.filter((key) => this.selected.has(key));
  }

  get anchorKey(): string | null {
    return this.anchor;
  }

  get focusKey(): string | null {
    return this.focus;
  }

  get size(): number {
    return this.selected.size;
  }

  isSelected(key: string): boolean {
    return this.selected.has(key);
  }

  setKeys(keys: readonly string[]): void {
    this.assertActive();
    const deduped: string[] = [];
    const indexMap = new Map<string, number>();
    for (const key of keys) {
      if (typeof key !== 'string' || !key.trim() || indexMap.has(key)) continue;
      indexMap.set(key, deduped.length);
      deduped.push(key);
    }
    this.orderedKeys = deduped;
    this.keyIndex = indexMap;
    this.selected = new Set([...this.selected].filter((key) => indexMap.has(key)));
    if (this.anchor !== null && !indexMap.has(this.anchor)) this.anchor = null;
    if (this.focus !== null && !indexMap.has(this.focus)) this.focus = null;
    this.notify();
  }

  selectSingle(key: string): void {
    this.assertActive();
    if (!this.keyIndex.has(key)) return;
    this.selected = new Set([key]);
    this.anchor = key;
    this.focus = key;
    this.notify();
  }

  toggle(key: string): void {
    this.assertActive();
    if (!this.keyIndex.has(key)) return;
    const next = new Set(this.selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.selected = next;
    this.anchor = key;
    this.focus = key;
    this.notify();
  }

  selectRange(toKey: string, options: RangeSelectionOptions = {}): void {
    this.assertActive();
    const toIndex = this.keyIndex.get(toKey);
    if (toIndex === undefined) return;

    if (this.anchor === null || !this.keyIndex.has(this.anchor)) {
      this.selected = options.additive ? new Set([...this.selected, toKey]) : new Set([toKey]);
      this.anchor = toKey;
      this.focus = toKey;
      this.notify();
      return;
    }

    const fromIndex = this.keyIndex.get(this.anchor)!;
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const rangeSlice = this.orderedKeys.slice(start, end + 1);
    this.selected = options.additive
      ? new Set([...this.selected, ...rangeSlice])
      : new Set(rangeSlice);
    this.focus = toKey;
    this.notify();
  }

  selectAll(): void {
    this.assertActive();
    this.selected = new Set(this.orderedKeys);
    this.notify();
  }

  clear(): void {
    this.assertActive();
    this.selected = new Set();
    this.anchor = null;
    this.focus = null;
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
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }

  private assertActive(): void {
    if (this.destroyed) throw new Error('RangeSelectionController has been destroyed.');
  }
}

export function createRangeSelectionController(keys: readonly string[] = []): RangeSelectionController {
  return new RangeSelectionController(keys);
}
