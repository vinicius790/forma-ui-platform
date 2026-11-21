import { Virtualizer, type VirtualItem } from './index';

export interface GridVirtualizerOptions {
  rowCount: number;
  columnCount: number;
  estimateRowHeight: number | ((rowIndex: number) => number);
  estimateColumnWidth: number | ((columnIndex: number) => number);
  rowOverscan?: number;
  columnOverscan?: number;
  rowGap?: number;
  columnGap?: number;
  pinnedTopRows?: number;
  pinnedLeftColumns?: number;
}

export interface VirtualGridSnapshot {
  rows: readonly VirtualItem<number>[];
  columns: readonly VirtualItem<number>[];
  pinnedRows: readonly VirtualItem<number>[];
  pinnedColumns: readonly VirtualItem<number>[];
  totalHeight: number;
  totalWidth: number;
}

/**
 * Two-dimensional virtualizer combining independent Fenwick-tree row & column virtualizers
 * with optional pinned header rows and pinned left columns for high-density Data Grids.
 */
export class GridVirtualizer {
  readonly rowVirtualizer: Virtualizer<number>;
  readonly columnVirtualizer: Virtualizer<number>;
  private pinnedTopRows: number;
  private pinnedLeftColumns: number;

  constructor(options: GridVirtualizerOptions) {
    this.pinnedTopRows = Math.max(0, Math.floor(options.pinnedTopRows ?? 0));
    this.pinnedLeftColumns = Math.max(0, Math.floor(options.pinnedLeftColumns ?? 0));
    this.rowVirtualizer = new Virtualizer({
      count: options.rowCount,
      estimateSize: options.estimateRowHeight,
      overscan: options.rowOverscan ?? 3,
      gap: options.rowGap ?? 0,
      horizontal: false,
    });
    this.columnVirtualizer = new Virtualizer({
      count: options.columnCount,
      estimateSize: options.estimateColumnWidth,
      overscan: options.columnOverscan ?? 2,
      gap: options.columnGap ?? 0,
      horizontal: true,
    });
  }

  setViewport2D(scrollTop: number, scrollLeft: number, clientHeight: number, clientWidth: number): void {
    this.rowVirtualizer.setViewport(scrollTop, clientHeight);
    this.columnVirtualizer.setViewport(scrollLeft, clientWidth);
  }

  measureRow(index: number, height: number): void {
    this.rowVirtualizer.measure(index, height);
  }

  measureColumn(index: number, width: number): void {
    this.columnVirtualizer.measure(index, width);
  }

  getSnapshot(): VirtualGridSnapshot {
    const pinnedRows: VirtualItem<number>[] = [];
    for (let r = 0; r < Math.min(this.pinnedTopRows, this.rowVirtualizer.count); r += 1) {
      const start = this.rowVirtualizer.getOffsetForIndex(r);
      const end = this.rowVirtualizer.getOffsetForIndex(r + 1);
      pinnedRows.push({ index: r, key: r, start, end, size: Math.max(1, end - start), lane: 0 });
    }
    const pinnedColumns: VirtualItem<number>[] = [];
    for (let c = 0; c < Math.min(this.pinnedLeftColumns, this.columnVirtualizer.count); c += 1) {
      const start = this.columnVirtualizer.getOffsetForIndex(c);
      const end = this.columnVirtualizer.getOffsetForIndex(c + 1);
      pinnedColumns.push({ index: c, key: c, start, end, size: Math.max(1, end - start), lane: 0 });
    }
    return {
      rows: this.rowVirtualizer.getVirtualItems().filter((item) => item.index >= this.pinnedTopRows),
      columns: this.columnVirtualizer.getVirtualItems().filter((item) => item.index >= this.pinnedLeftColumns),
      pinnedRows,
      pinnedColumns,
      totalHeight: this.rowVirtualizer.totalSize,
      totalWidth: this.columnVirtualizer.totalSize,
    };
  }

  destroy(): void {
    this.rowVirtualizer.destroy();
    this.columnVirtualizer.destroy();
  }
}

export function createGridVirtualizer(options: GridVirtualizerOptions): GridVirtualizer {
  return new GridVirtualizer(options);
}
