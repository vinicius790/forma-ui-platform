import { createId } from '../primitives/id';

export interface TreeGridRow {
  id: string;
  level: number;
  hasChildren?: boolean;
  disabled?: boolean;
  setSize?: number;
  posInSet?: number;
}

export interface TreeGridCellCoord {
  rowIndex: number;
  colIndex: number;
}

export interface TreeGridOptions {
  id?: string;
  rows: readonly TreeGridRow[];
  columnCount: number;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  focusedCell?: TreeGridCellCoord;
  onExpandedChange?: (expandedIds: string[]) => void;
  onFocusChange?: (cell: TreeGridCellCoord) => void;
}

export class TreeGridController {
  private options: TreeGridOptions;
  private internalExpanded: Set<string>;
  private internalFocus: TreeGridCellCoord;
  readonly baseId: string;

  constructor(options: TreeGridOptions) {
    this.options = { ...options };
    this.internalExpanded = new Set(options.defaultExpandedIds ?? []);
    this.internalFocus = options.focusedCell ?? { rowIndex: 0, colIndex: 0 };
    this.baseId = options.id ?? createId('forma-treegrid');
  }

  get expandedIds(): string[] {
    return this.options.expandedIds ? [...this.options.expandedIds] : [...this.internalExpanded];
  }

  get focusedCell(): TreeGridCellCoord {
    return this.options.focusedCell ?? this.internalFocus;
  }

  isExpanded(rowId: string): boolean {
    return this.options.expandedIds ? this.options.expandedIds.includes(rowId) : this.internalExpanded.has(rowId);
  }

  updateOptions(options: Partial<TreeGridOptions>): void {
    this.options = { ...this.options, ...options };
  }

  toggleExpand(rowId: string, force?: boolean): void {
    const row = this.options.rows.find((r) => r.id === rowId);
    if (!row || !row.hasChildren || row.disabled) return;
    const currently = this.isExpanded(rowId);
    const nextState = force ?? !currently;
    if (nextState === currently) return;
    const next = new Set(this.expandedIds);
    if (nextState) next.add(rowId);
    else next.delete(rowId);
    if (this.options.expandedIds === undefined) this.internalExpanded = next;
    this.options.onExpandedChange?.([...next]);
  }

  focusCell(rowIndex: number, colIndex: number): void {
    const maxRow = Math.max(0, this.options.rows.length - 1);
    const maxCol = Math.max(0, this.options.columnCount - 1);
    const next = {
      rowIndex: Math.min(maxRow, Math.max(0, Math.trunc(rowIndex))),
      colIndex: Math.min(maxCol, Math.max(0, Math.trunc(colIndex))),
    };
    if (this.options.focusedCell === undefined) this.internalFocus = next;
    this.options.onFocusChange?.(next);
  }

  handleKeyDown(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'preventDefault'>): void {
    const { rowIndex, colIndex } = this.focusedCell;
    const row = this.options.rows[rowIndex];
    if (!row) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusCell(rowIndex + 1, colIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusCell(rowIndex - 1, colIndex);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (colIndex === 0 && row.hasChildren && !this.isExpanded(row.id)) {
        this.toggleExpand(row.id, true);
      } else {
        this.focusCell(rowIndex, colIndex + 1);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (colIndex === 0 && row.hasChildren && this.isExpanded(row.id)) {
        this.toggleExpand(row.id, false);
      } else {
        this.focusCell(rowIndex, colIndex - 1);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focusCell(event.ctrlKey ? 0 : rowIndex, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focusCell(event.ctrlKey ? this.options.rows.length - 1 : rowIndex, this.options.columnCount - 1);
    }
  }

  getRootProps(label = 'Tree grid') {
    return {
      id: this.baseId,
      role: 'treegrid' as const,
      'aria-label': label,
      'aria-rowcount': this.options.rows.length,
      'aria-colcount': this.options.columnCount,
      onKeyDown: (e: KeyboardEvent) => this.handleKeyDown(e),
    };
  }

  getRowProps(rowIndex: number) {
    const row = this.options.rows[rowIndex];
    if (!row) return { role: 'row' as const };
    return {
      id: `${this.baseId}-row-${row.id}`,
      role: 'row' as const,
      'aria-level': row.level,
      'aria-expanded': row.hasChildren ? this.isExpanded(row.id) : undefined,
      'aria-setsize': row.setSize,
      'aria-posinset': row.posInSet,
      'aria-disabled': row.disabled || undefined,
      'data-state': row.hasChildren ? (this.isExpanded(row.id) ? 'expanded' : 'collapsed') : undefined,
    };
  }

  getCellProps(rowIndex: number, colIndex: number) {
    const focused = this.focusedCell.rowIndex === rowIndex && this.focusedCell.colIndex === colIndex;
    return {
      role: 'gridcell' as const,
      tabIndex: focused ? 0 : -1,
      'aria-colindex': colIndex + 1,
      'data-focused': focused ? 'true' : undefined,
      onClick: () => this.focusCell(rowIndex, colIndex),
    };
  }

  destroy(): void {
    // Idempotent cleanup
  }
}

export function createTreeGridController(options: TreeGridOptions): TreeGridController {
  return new TreeGridController(options);
}
