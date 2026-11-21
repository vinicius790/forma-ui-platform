export interface TreeTableColumn { id: string; header: string; width?: number; pinned?: 'left' | 'right' }
export interface TreeTableNode<T = Record<string, unknown>> { id: string; values: T; children?: readonly TreeTableNode<T>[] }

export class TreeTableController<T = Record<string, unknown>> {
  private columnsList: readonly TreeTableColumn[];
  private roots: readonly TreeTableNode<T>[];
  private expanded = new Set<string>();
  constructor(options: { columns: readonly TreeTableColumn[]; rows: readonly TreeTableNode<T>[]; defaultExpandedIds?: readonly string[] }) {
    this.columnsList = options.columns;
    this.roots = options.rows;
    for (const id of options.defaultExpandedIds ?? []) this.expanded.add(id);
  }
  get columns(): readonly TreeTableColumn[] { return this.columnsList; }
  isExpanded(id: string): boolean { return this.expanded.has(id); }
  toggleRow(id: string): void { if (this.expanded.has(id)) this.expanded.delete(id); else this.expanded.add(id); }
  getVisibleRows(): Array<{ id: string; depth: number; hasChildren: boolean; expanded: boolean; values: T }> {
    const out: Array<{ id: string; depth: number; hasChildren: boolean; expanded: boolean; values: T }> = [];
    const walk = (nodes: readonly TreeTableNode<T>[], depth: number) => {
      for (const n of nodes) {
        const hasChildren = Boolean(n.children && n.children.length > 0);
        const isExp = hasChildren && this.expanded.has(n.id);
        out.push({ id: n.id, depth, hasChildren, expanded: isExp, values: n.values });
        if (isExp && n.children) walk(n.children, depth + 1);
      }
    };
    walk(this.roots, 1);
    return out;
  }
  destroy(): void { this.expanded.clear(); }
}
export function createTreeTableController<T = Record<string, unknown>>(options: { columns: readonly TreeTableColumn[]; rows: readonly TreeTableNode<T>[]; defaultExpandedIds?: readonly string[] }): TreeTableController<T> {
  return new TreeTableController(options);
}
