import { getDirectionalKey, type Direction } from '../primitives/keyboard';

export type GridCell = { row: number; column: number };
export type GridSelectionMode = 'none' | 'single' | 'multiple';
export interface GridControllerOptions {
  rows: number;
  columns: number;
  direction?: Direction;
  disabled?: boolean;
  loopX?: boolean;
  loopY?: boolean;
  selectionMode?: GridSelectionMode;
  activeCell?: GridCell;
  defaultActiveCell?: GridCell;
  selectedCells?: readonly GridCell[];
  defaultSelectedCells?: readonly GridCell[];
  isCellDisabled?: (cell: GridCell) => boolean;
  onActiveCellChange?: (cell: GridCell) => void;
  onSelectedCellsChange?: (cells: readonly GridCell[]) => void;
  onCellActivate?: (cell: GridCell) => void;
}

const keyOf = ({ row, column }: GridCell): string => `${row}:${column}`;
const sameCell = (a: GridCell, b: GridCell): boolean => a.row === b.row && a.column === b.column;

/**
 * Two-dimensional roving-focus controller for interactive data grids.
 * It manages navigation and selection metadata only; cell rendering and data
 * semantics remain under the consumer's control.
 */
export class GridController {
  private options: GridControllerOptions;
  private internalActive: GridCell;
  private internalSelected: Map<string, GridCell>;
  private cells = new Map<string, HTMLElement>();
  private destroyed = false;

  constructor(options: GridControllerOptions) {
    this.options = { direction: 'ltr', loopX: false, loopY: false, selectionMode: 'none', ...options };
    this.assertDimensions(options.rows, options.columns);
    const initial = options.defaultActiveCell ?? options.activeCell ?? { row: 0, column: 0 };
    this.internalActive = this.normalizeCell(initial);
    this.internalSelected = new Map((options.defaultSelectedCells ?? []).map((cell) => [keyOf(cell), this.normalizeCell(cell)]));
  }

  get activeCell(): GridCell { return { ...(this.options.activeCell ?? this.internalActive) }; }
  get selectedCells(): readonly GridCell[] {
    const selected = this.options.selectedCells ?? [...this.internalSelected.values()];
    return selected.map((cell) => ({ ...cell }));
  }

  updateOptions(options: Partial<GridControllerOptions>): void {
    this.assertActive();
    this.options = { ...this.options, ...options };
    this.assertDimensions(this.options.rows, this.options.columns);
    this.internalActive = this.normalizeCell(this.activeCell);
    this.internalSelected = new Map(this.selectedCells.filter((cell) => this.isInBounds(cell)).map((cell) => [keyOf(cell), cell]));
  }

  registerCell(cell: GridCell, element: HTMLElement | null): () => void {
    this.assertActive();
    if (!this.isInBounds(cell)) return () => undefined;
    const key = keyOf(cell);
    if (element) this.cells.set(key, element);
    else this.cells.delete(key);
    return () => { if (this.cells.get(key) === element) this.cells.delete(key); };
  }

  focusCell(cell: GridCell): void {
    this.assertActive();
    if (this.options.disabled || !this.isFocusable(cell)) return;
    const next = this.normalizeCell(cell);
    if (this.options.activeCell === undefined) this.internalActive = next;
    this.options.onActiveCellChange?.({ ...next });
    this.cells.get(keyOf(next))?.focus();
  }

  selectCell(cell: GridCell, additive = false): void {
    this.assertActive();
    if (this.options.disabled || this.options.selectionMode === 'none' || !this.isFocusable(cell)) return;
    const normalized = this.normalizeCell(cell);
    const next = this.options.selectionMode === 'multiple' && additive
      ? new Map(this.selectedCells.map((item) => [keyOf(item), item]))
      : new Map<string, GridCell>();
    const key = keyOf(normalized);
    if (next.has(key) && this.options.selectionMode === 'multiple' && additive) next.delete(key);
    else next.set(key, normalized);
    this.commitSelection([...next.values()]);
  }

  selectAll(): void {
    this.assertActive();
    if (this.options.disabled || this.options.selectionMode !== 'multiple') return;
    const cells: GridCell[] = [];
    for (let row = 0; row < this.options.rows; row += 1) {
      for (let column = 0; column < this.options.columns; column += 1) {
        const cell = { row, column };
        if (this.isFocusable(cell)) cells.push(cell);
      }
    }
    this.commitSelection(cells);
  }

  clearSelection(): void { this.assertActive(); this.commitSelection([]); }

  getRootProps(label?: string) {
    return {
      role: 'grid' as const,
      'aria-label': label,
      'aria-rowcount': this.options.rows,
      'aria-colcount': this.options.columns,
      'aria-multiselectable': this.options.selectionMode === 'multiple' ? true : undefined,
      'aria-disabled': this.options.disabled || undefined,
      onKeyDown: (event: KeyboardEvent) => this.onKeyDown(event),
    };
  }

  getCellProps(cell: GridCell) {
    if (!this.isInBounds(cell)) throw new RangeError('Grid cell is outside the configured dimensions.');
    const active = sameCell(this.activeCell, cell);
    const selected = this.selectedCells.some((item) => sameCell(item, cell));
    const disabled = Boolean(this.options.disabled || this.options.isCellDisabled?.(cell));
    return {
      role: 'gridcell' as const,
      'aria-rowindex': cell.row + 1,
      'aria-colindex': cell.column + 1,
      'aria-selected': this.options.selectionMode === 'none' ? undefined : selected,
      'aria-disabled': disabled || undefined,
      tabIndex: active && !disabled ? 0 : -1,
      ref: (element: HTMLElement | null) => this.registerCell(cell, element),
      onFocus: () => this.focusCell(cell),
      onClick: () => { if (!disabled) { this.focusCell(cell); this.options.onCellActivate?.({ ...cell }); } },
    };
  }

  destroy(): void { if (this.destroyed) return; this.destroyed = true; this.cells.clear(); }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.options.disabled || event.isComposing || event.keyCode === 229 || event.altKey) return;
    const active = this.activeCell;
    const key = getDirectionalKey(event.key, this.options.direction ?? 'ltr');
    let next: GridCell | undefined;
    if (key === 'ArrowRight') next = this.findNext(active, 0, 1);
    else if (key === 'ArrowLeft') next = this.findNext(active, 0, -1);
    else if (key === 'ArrowDown') next = this.findNext(active, 1, 0);
    else if (key === 'ArrowUp') next = this.findNext(active, -1, 0);
    else if (key === 'Home') next = event.ctrlKey || event.metaKey ? this.findFirst() : this.findInRow(active.row, 0, 1);
    else if (key === 'End') next = event.ctrlKey || event.metaKey ? this.findLast() : this.findInRow(active.row, this.options.columns - 1, -1);
    else if (key === 'PageDown') next = this.findNext(active, Math.max(1, Math.floor(this.options.rows / 5)), 0);
    else if (key === 'PageUp') next = this.findNext(active, -Math.max(1, Math.floor(this.options.rows / 5)), 0);
    else if (key === ' ' || key === 'Enter') {
      if (!this.isFocusable(active)) return;
      event.preventDefault();
      if (this.options.selectionMode !== 'none') this.selectCell(active, event.ctrlKey || event.metaKey || event.shiftKey);
      this.options.onCellActivate?.({ ...active });
      return;
    } else if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'a' && this.options.selectionMode === 'multiple') {
      event.preventDefault();
      this.selectAll();
      return;
    } else return;
    if (next) { event.preventDefault(); this.focusCell(next); }
  }

  private findNext(from: GridCell, rowDelta: number, columnDelta: number): GridCell | undefined {
    let row = from.row + rowDelta;
    let column = from.column + columnDelta;
    const rowStep = Math.sign(rowDelta);
    const columnStep = Math.sign(columnDelta);
    const limit = Math.max(this.options.rows, this.options.columns) + 1;
    for (let attempt = 0; attempt < limit; attempt += 1) {
      if (row < 0 || row >= this.options.rows) {
        if (!this.options.loopY || rowStep === 0) return undefined;
        row = (row + this.options.rows) % this.options.rows;
      }
      if (column < 0 || column >= this.options.columns) {
        if (!this.options.loopX || columnStep === 0) return undefined;
        column = (column + this.options.columns) % this.options.columns;
      }
      const candidate = { row, column };
      if (this.isFocusable(candidate)) return candidate;
      row += rowStep;
      column += columnStep;
    }
    return undefined;
  }

  private findInRow(row: number, start: number, delta: number): GridCell | undefined {
    for (let column = start; column >= 0 && column < this.options.columns; column += delta) {
      const cell = { row, column };
      if (this.isFocusable(cell)) return cell;
    }
    return undefined;
  }

  private findFirst(): GridCell | undefined {
    for (let row = 0; row < this.options.rows; row += 1) {
      const found = this.findInRow(row, 0, 1);
      if (found) return found;
    }
    return undefined;
  }

  private findLast(): GridCell | undefined {
    for (let row = this.options.rows - 1; row >= 0; row -= 1) {
      const found = this.findInRow(row, this.options.columns - 1, -1);
      if (found) return found;
    }
    return undefined;
  }

  private isInBounds(cell: GridCell): boolean {
    return Number.isInteger(cell.row) && Number.isInteger(cell.column)
      && cell.row >= 0 && cell.row < this.options.rows
      && cell.column >= 0 && cell.column < this.options.columns;
  }
  private isFocusable(cell: GridCell): boolean { return this.isInBounds(cell) && !this.options.isCellDisabled?.(cell); }
  private normalizeCell(cell: GridCell): GridCell {
    const row = Math.max(0, Math.min(this.options.rows - 1, Math.floor(cell.row)));
    const column = Math.max(0, Math.min(this.options.columns - 1, Math.floor(cell.column)));
    return { row, column };
  }
  private commitSelection(cells: GridCell[]): void {
    this.internalSelected = new Map(cells.map((cell) => [keyOf(cell), { ...cell }]));
    this.options.onSelectedCellsChange?.(cells.map((cell) => ({ ...cell })));
  }
  private assertDimensions(rows: number, columns: number): void {
    if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1) {
      throw new RangeError('Grid dimensions must be positive integers.');
    }
  }
  private assertActive(): void { if (this.destroyed) throw new Error('GridController has been destroyed.'); }
}

export function createGridController(options: GridControllerOptions): GridController { return new GridController(options); }
