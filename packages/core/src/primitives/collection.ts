import { normalizeSearchText, Typeahead } from './typeahead';

export type CollectionKey = string;
export interface CollectionItem<T = unknown> {
  readonly key: CollectionKey;
  readonly value: T;
  readonly textValue?: string;
  readonly disabled?: boolean;
}

/** Stable keyed collection used by listbox, menu, tree and virtualized patterns. */
export class ListCollection<T = unknown> {
  private records: CollectionItem<T>[] = [];
  private byKey = new Map<CollectionKey, CollectionItem<T>>();

  constructor(items: readonly CollectionItem<T>[] = []) { this.setItems(items); }

  setItems(items: readonly CollectionItem<T>[]): void {
    const map = new Map<CollectionKey, CollectionItem<T>>();
    for (const item of items) {
      if (!item.key || !item.key.trim()) throw new Error('Collection keys must be non-empty strings.');
      if (map.has(item.key)) throw new Error(`Duplicate collection key: ${item.key}`);
      map.set(item.key, item);
    }
    this.records = [...items];
    this.byKey = map;
  }

  get size(): number { return this.records.length; }
  get items(): readonly CollectionItem<T>[] { return this.records; }
  getItem(key: CollectionKey): CollectionItem<T> | undefined { return this.byKey.get(key); }
  getIndex(key: CollectionKey): number { return this.records.findIndex((item) => item.key === key); }
  has(key: CollectionKey): boolean { return this.byKey.has(key); }
  getEnabledItems(): CollectionItem<T>[] { return this.records.filter((item) => !item.disabled); }
  getFirstKey(): CollectionKey | undefined { return this.getEnabledItems()[0]?.key; }
  getLastKey(): CollectionKey | undefined { return this.getEnabledItems().at(-1)?.key; }

  getKeyAfter(key?: CollectionKey, loop = false): CollectionKey | undefined {
    return this.getRelativeKey(key, 1, loop);
  }
  getKeyBefore(key?: CollectionKey, loop = false): CollectionKey | undefined {
    return this.getRelativeKey(key, -1, loop);
  }

  getKeyForSearch(query: string, currentKey?: CollectionKey, locale?: string): CollectionKey | undefined {
    const normalized = normalizeSearchText(query, locale);
    if (!normalized) return undefined;
    const enabled = this.getEnabledItems();
    const start = Math.max(-1, enabled.findIndex((item) => item.key === currentKey));
    for (let offset = 1; offset <= enabled.length; offset += 1) {
      const item = enabled[(start + offset) % enabled.length];
      if (normalizeSearchText(item?.textValue ?? String(item?.value ?? ''), locale).startsWith(normalized)) return item?.key;
    }
    return undefined;
  }

  private getRelativeKey(key: CollectionKey | undefined, delta: number, loop: boolean): CollectionKey | undefined {
    const enabled = this.getEnabledItems();
    if (!enabled.length) return undefined;
    const index = enabled.findIndex((item) => item.key === key);
    if (index < 0) return delta > 0 ? enabled[0]?.key : enabled.at(-1)?.key;
    const next = index + delta;
    if (loop) return enabled[(next + enabled.length) % enabled.length]?.key;
    return enabled[Math.max(0, Math.min(enabled.length - 1, next))]?.key;
  }
}

export type SelectionMode = 'none' | 'single' | 'multiple';
export type SelectionSnapshot = ReadonlySet<CollectionKey>;

/** Selection logic independent from DOM and framework rendering. */
export class SelectionManager {
  private selected = new Set<CollectionKey>();
  private anchor: CollectionKey | null = null;
  constructor(
    private collection: ListCollection,
    private mode: SelectionMode = 'single',
    initial: Iterable<CollectionKey> = [],
  ) {
    this.setSelected(initial);
  }

  updateCollection(collection: ListCollection): void {
    this.collection = collection;
    this.selected = new Set([...this.selected].filter((key) => collection.has(key)));
    if (this.anchor && !collection.has(this.anchor)) this.anchor = null;
  }
  updateMode(mode: SelectionMode): void {
    this.mode = mode;
    if (mode === 'none') this.selected.clear();
    if (mode === 'single' && this.selected.size > 1) this.selected = new Set([this.selected.values().next().value as string]);
  }
  isSelected(key: CollectionKey): boolean { return this.selected.has(key); }
  getSelection(): SelectionSnapshot { return new Set(this.selected); }
  get anchorKey(): CollectionKey | null { return this.anchor; }
  setAnchor(key: CollectionKey | null): void { this.anchor = key; }

  setSelected(keys: Iterable<CollectionKey>): void {
    if (this.mode === 'none') { this.selected.clear(); return; }
    const enabled = [...keys].filter((key) => this.collection.has(key) && !this.collection.getItem(key)?.disabled);
    this.selected = new Set(this.mode === 'single' ? enabled.slice(0, 1) : enabled);
  }
  select(key: CollectionKey): void {
    if (this.mode === 'none' || !this.isEnabled(key)) return;
    this.selected = this.mode === 'single' ? new Set([key]) : new Set([...this.selected, key]);
    this.anchor = key;
  }
  deselect(key: CollectionKey): void {
    if (this.mode === 'none') return;
    const next = new Set(this.selected);
    next.delete(key);
    this.selected = next;
  }
  toggle(key: CollectionKey): void {
    if (this.selected.has(key)) this.deselect(key);
    else this.select(key);
  }
  clear(): void { this.selected.clear(); this.anchor = null; }
  selectAll(): void {
    if (this.mode !== 'multiple') return;
    this.selected = new Set(this.collection.getEnabledItems().map((item) => item.key));
  }
  selectRange(toKey: CollectionKey, fromKey = this.anchor ?? toKey): void {
    if (this.mode !== 'multiple' || !this.isEnabled(toKey) || !this.isEnabled(fromKey)) return;
    const enabled = this.collection.getEnabledItems();
    const from = enabled.findIndex((item) => item.key === fromKey);
    const to = enabled.findIndex((item) => item.key === toKey);
    if (from < 0 || to < 0) return;
    const range = enabled.slice(Math.min(from, to), Math.max(from, to) + 1).map((item) => item.key);
    this.selected = new Set([...this.selected, ...range]);
  }
  private isEnabled(key: CollectionKey): boolean {
    return Boolean(this.collection.getItem(key) && !this.collection.getItem(key)?.disabled);
  }
}

export interface TreeNode<T = unknown> extends CollectionItem<T> {
  readonly children?: readonly TreeNode<T>[];
}
export interface FlatTreeNode<T = unknown> extends CollectionItem<T> {
  readonly level: number;
  readonly posInSet: number;
  readonly setSize: number;
  readonly parentKey: CollectionKey | null;
  readonly hasChildren: boolean;
  readonly expanded: boolean;
}

/** Tree collection with stable parent/level metadata and a visible flattened view. */
export class TreeCollection<T = unknown> {
  private roots: readonly TreeNode<T>[];
  private records = new Map<CollectionKey, { node: TreeNode<T>; parentKey: CollectionKey | null; level: number; index: number; siblingCount: number }>();
  private expanded = new Set<CollectionKey>();

  constructor(nodes: readonly TreeNode<T>[], expandedKeys: Iterable<CollectionKey> = []) {
    this.roots = nodes;
    this.reindex();
    this.setExpandedKeys(expandedKeys);
  }

  setNodes(nodes: readonly TreeNode<T>[]): void { this.roots = nodes; this.reindex(); }
  setExpandedKeys(keys: Iterable<CollectionKey>): void { this.expanded = new Set([...keys].filter((key) => this.hasChildren(key))); }
  getExpandedKeys(): ReadonlySet<CollectionKey> { return new Set(this.expanded); }
  isExpanded(key: CollectionKey): boolean { return this.expanded.has(key); }
  getNode(key: CollectionKey): TreeNode<T> | undefined { return this.records.get(key)?.node; }
  getParentKey(key: CollectionKey): CollectionKey | null | undefined { return this.records.get(key)?.parentKey; }
  getLevel(key: CollectionKey): number | undefined { return this.records.get(key)?.level; }
  hasChildren(key: CollectionKey): boolean { return Boolean(this.records.get(key)?.node.children?.length); }
  toggleExpanded(key: CollectionKey): void {
    if (!this.hasChildren(key)) return;
    if (this.expanded.has(key)) this.expanded.delete(key);
    else this.expanded.add(key);
  }
  expand(key: CollectionKey): void { if (this.hasChildren(key)) this.expanded.add(key); }
  collapse(key: CollectionKey): void { this.expanded.delete(key); }

  getVisibleNodes(): FlatTreeNode<T>[] {
    const output: FlatTreeNode<T>[] = [];
    const walk = (nodes: readonly TreeNode<T>[], level: number, parentKey: string | null) => {
      nodes.forEach((node, index) => {
        output.push({ ...node, level, posInSet: index + 1, setSize: nodes.length, parentKey, hasChildren: Boolean(node.children?.length), expanded: this.expanded.has(node.key) });
        if (node.children?.length && this.expanded.has(node.key)) walk(node.children, level + 1, node.key);
      });
    };
    walk(this.roots, 1, null);
    return output;
  }
  getVisibleKeys(): CollectionKey[] { return this.getVisibleNodes().map((node) => node.key); }
  getNextVisibleKey(key: CollectionKey, delta: number): CollectionKey | undefined {
    const keys = this.getVisibleKeys();
    const index = keys.indexOf(key);
    return keys[Math.max(0, Math.min(keys.length - 1, index + delta))];
  }
  getFirstVisibleKey(): CollectionKey | undefined { return this.getVisibleKeys()[0]; }
  getLastVisibleKey(): CollectionKey | undefined { return this.getVisibleKeys().at(-1); }

  private reindex(): void {
    const records = new Map<CollectionKey, { node: TreeNode<T>; parentKey: CollectionKey | null; level: number; index: number; siblingCount: number }>();
    const walk = (nodes: readonly TreeNode<T>[], level: number, parentKey: string | null) => {
      nodes.forEach((node, index) => {
        if (!node.key || records.has(node.key)) throw new Error(`Tree node keys must be unique and non-empty: ${node.key}`);
        records.set(node.key, { node, parentKey, level, index, siblingCount: nodes.length });
        if (node.children) walk(node.children, level + 1, node.key);
      });
    };
    walk(this.roots, 1, null);
    this.records = records;
    this.expanded = new Set([...this.expanded].filter((key) => records.has(key) && Boolean(records.get(key)?.node.children?.length)));
  }
}

export function createTypeahead(timeout = 700): Typeahead { return new Typeahead(timeout); }
