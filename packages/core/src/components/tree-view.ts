import { TreeCollection, type TreeNode } from '../primitives/collection';
import { getDirectionalKey, type Direction } from '../primitives/keyboard';
import { Typeahead } from '../primitives/typeahead';

export interface TreeViewOptions<T = unknown> {
  nodes: readonly TreeNode<T>[];
  expandedKeys?: Iterable<string>;
  selectedKeys?: Iterable<string>;
  defaultExpandedKeys?: Iterable<string>;
  defaultSelectedKeys?: Iterable<string>;
  selectionMode?: 'none' | 'single' | 'multiple';
  direction?: Direction;
  disabled?: boolean;
  onExpandedChange?: (keys: ReadonlySet<string>) => void;
  onSelectedChange?: (keys: ReadonlySet<string>) => void;
}

/** Tree view with hierarchical keyboard navigation and APG treeitem metadata. */
export class TreeViewController<T = unknown> {
  private options: TreeViewOptions<T>;
  private collection: TreeCollection<T>;
  private internalExpanded: Set<string>;
  private internalSelected: Set<string>;
  private focusedKey?: string;
  private itemElements = new Map<string, HTMLElement>();
  private typeahead = new Typeahead();

  constructor(options: TreeViewOptions<T>) {
    this.options = { selectionMode: 'single', direction: 'ltr', ...options };
    this.collection = new TreeCollection(options.nodes, options.expandedKeys ?? options.defaultExpandedKeys ?? []);
    this.internalExpanded = new Set(options.defaultExpandedKeys ?? []);
    this.internalSelected = new Set(options.defaultSelectedKeys ?? []);
    this.focusedKey = this.collection.getFirstVisibleKey();
  }

  get expandedKeys(): ReadonlySet<string> { return new Set(this.options.expandedKeys ?? this.internalExpanded); }
  get selectedKeys(): ReadonlySet<string> { return new Set(this.options.selectedKeys ?? this.internalSelected); }
  get visibleNodes() { this.collection.setExpandedKeys(this.expandedKeys); return this.collection.getVisibleNodes(); }
  get focusedKeyValue(): string | undefined { return this.focusedKey; }

  updateOptions(options: Partial<TreeViewOptions<T>>): void {
    this.options = { ...this.options, ...options };
    if (options.nodes) this.collection.setNodes(options.nodes);
    this.collection.setExpandedKeys(this.expandedKeys);
    if (this.focusedKey && !this.visibleNodes.some((node) => node.key === this.focusedKey)) {
      this.focusedKey = this.visibleNodes[0]?.key;
      if (this.focusedKey) this.itemElements.get(this.focusedKey)?.focus();
    }
  }

  focus(key: string): void {
    if (this.options.disabled || !this.visibleNodes.some((node) => node.key === key && !node.disabled)) return;
    this.focusedKey = key;
    this.itemElements.get(key)?.focus();
  }

  registerItem(key: string, element: HTMLElement | null): () => void {
    if (element) this.itemElements.set(key, element);
    else this.itemElements.delete(key);
    return () => { if (this.itemElements.get(key) === element) this.itemElements.delete(key); };
  }

  toggleExpanded(key: string): void {
    if (this.options.disabled || !this.collection.hasChildren(key)) return;
    const next = new Set(this.expandedKeys);
    const collapsing = next.has(key);
    if (collapsing) {
      next.delete(key);
      if (this.isDescendantOf(this.focusedKey, key)) this.focusedKey = key;
    } else next.add(key);
    this.commitExpanded(next);
    if (this.focusedKey) this.itemElements.get(this.focusedKey)?.focus();
  }

  select(key: string, additive = false): void {
    const node = this.collection.getNode(key);
    if (this.options.disabled || !node || node.disabled || this.options.selectionMode === 'none') return;
    const next = this.options.selectionMode === 'multiple' && additive
      ? new Set(this.selectedKeys)
      : new Set<string>();
    if (next.has(key) && this.options.selectionMode === 'multiple' && additive) next.delete(key);
    else next.add(key);
    this.commitSelected(next);
  }

  getRootProps(label?: string) {
    return {
      role: 'tree' as const,
      'aria-label': label,
      'aria-disabled': this.options.disabled || undefined,
      onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event),
    };
  }

  getItemProps(key: string) {
    const node = this.visibleNodes.find((entry) => entry.key === key);
    const selected = this.selectedKeys.has(key);
    return {
      id: key,
      role: 'treeitem' as const,
      'aria-level': node?.level,
      'aria-posinset': node?.posInSet,
      'aria-setsize': node?.setSize,
      'aria-expanded': node?.hasChildren ? node.expanded : undefined,
      'aria-selected': this.options.selectionMode === 'none' ? undefined : selected,
      'aria-disabled': node?.disabled || undefined,
      'data-focused': this.focusedKey === key ? '' : undefined,
      'data-selected': selected ? '' : undefined,
      tabIndex: this.focusedKey === key && !this.options.disabled ? 0 : -1,
      ref: (element: HTMLElement | null) => { this.registerItem(key, element); },
      onFocus: () => this.focus(key),
      onClick: (event: MouseEvent) => { this.focus(key); this.select(key, event.ctrlKey || event.metaKey); },
    };
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.options.disabled || event.isComposing || event.keyCode === 229) return;
    const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr');
    const visible = this.visibleNodes;
    const node = visible.find((item) => item.key === this.focusedKey);
    if (!node) return;
    const enabled = visible.filter((item) => !item.disabled);
    const enabledIndex = enabled.findIndex((item) => item.key === node.key);

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      const target = key === 'ArrowDown' ? enabled[enabledIndex + 1]?.key : enabled[enabledIndex - 1]?.key;
      if (target) this.focus(target);
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      const target = key === 'Home' ? enabled[0]?.key : enabled.at(-1)?.key;
      if (target) this.focus(target);
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      if (node.hasChildren && !node.expanded) this.toggleExpanded(node.key);
      else if (node.expanded) {
        const child = this.visibleNodes.find((item) => item.parentKey === node.key && !item.disabled);
        if (child) this.focus(child.key);
      }
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      if (node.hasChildren && node.expanded) this.toggleExpanded(node.key);
      else {
        let parent = this.collection.getParentKey(node.key);
        while (parent && this.collection.getNode(parent)?.disabled) {
          parent = this.collection.getParentKey(parent);
        }
        if (parent) this.focus(parent);
      }
    } else if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      this.select(node.key, event.ctrlKey || event.metaKey);
    } else if (key === '*') {
      event.preventDefault();
      const next = new Set(this.expandedKeys);
      for (const sibling of visible) {
        if (sibling.parentKey === node.parentKey && sibling.hasChildren && !sibling.disabled) next.add(sibling.key);
      }
      this.commitExpanded(next);
    } else if (Array.from(key).length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = this.typeahead.push(key, enabled.map((item) => item.textValue ?? String(item.value)), enabledIndex);
      const target = enabled[index]?.key;
      if (target) this.focus(target);
    }
  }

  destroy(): void { this.itemElements.clear(); this.typeahead.reset(); }

  private isDescendantOf(candidate: string | undefined, ancestor: string): boolean {
    let current = candidate;
    while (current) {
      const parent = this.collection.getParentKey(current);
      if (parent === ancestor) return true;
      current = parent ?? undefined;
    }
    return false;
  }

  private commitExpanded(next: Set<string>): void {
    if (this.options.expandedKeys === undefined) this.internalExpanded = next;
    this.options.onExpandedChange?.(new Set(next));
    this.collection.setExpandedKeys(next);
  }
  private commitSelected(next: Set<string>): void {
    if (this.options.selectionMode === 'single' && next.size > 1) next = new Set([next.values().next().value as string]);
    if (this.options.selectedKeys === undefined) this.internalSelected = next;
    this.options.onSelectedChange?.(new Set(next));
  }
}

export function createTreeViewController<T = unknown>(options: TreeViewOptions<T>): TreeViewController<T> {
  return new TreeViewController(options);
}
