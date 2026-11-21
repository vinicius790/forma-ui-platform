import type { DataGridColumn } from './index';
import { aggregateNumeric, type AggregationType } from './columns-and-export';

export type ExpandedIdsInput =
  | ReadonlySet<string>
  | Readonly<Record<string, boolean>>
  | readonly string[];

export interface FlattenedTreeRow<TData> {
  readonly id: string;
  readonly row: TData;
  readonly depth: number;
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly parentId: string | null;
}

function toExpandedSet(input: ExpandedIdsInput): ReadonlySet<string> {
  if (input instanceof Set) return input;
  if (Array.isArray(input)) return new Set(input);
  if (typeof (input as ReadonlySet<string>).has === 'function') return input as ReadonlySet<string>;
  const set = new Set<string>();
  for (const [id, expanded] of Object.entries(input as Readonly<Record<string, boolean>>)) {
    if (expanded) set.add(id);
  }
  return set;
}

/**
 * Flattens hierarchical tree rows into a visible list with depth, expansion, and parent metadata.
 * Guards against cyclic object references in caller-supplied trees.
 */
export function flattenTreeRows<TData>(
  roots: readonly TData[],
  getSubRows: (row: TData) => readonly TData[] | undefined | null,
  expandedIds: ExpandedIdsInput,
  getRowId: (row: TData, index: number, parentId: string | null) => string = (_row, index, parentId) =>
    parentId === null ? String(index) : `${parentId}.${index}`,
): FlattenedTreeRow<TData>[] {
  const expanded = toExpandedSet(expandedIds);
  const output: FlattenedTreeRow<TData>[] = [];
  const ancestors = new Set<TData>();

  const walk = (nodes: readonly TData[], depth: number, parentId: string | null): void => {
    for (let index = 0; index < nodes.length; index += 1) {
      const row = nodes[index]!;
      if (ancestors.has(row)) continue;
      const id = getRowId(row, index, parentId);
      const children = getSubRows(row);
      const hasChildren = Boolean(children && children.length > 0);
      const isExpanded = hasChildren && expanded.has(id);
      output.push({ id, row, depth, hasChildren, isExpanded, parentId });
      if (isExpanded && children) {
        ancestors.add(row);
        walk(children, depth + 1, id);
        ancestors.delete(row);
      }
    }
  };

  walk(roots, 0, null);
  return output;
}

export type PivotFieldAccessor<TData> = (keyof TData & string) | string | ((row: TData) => unknown);

export interface PivotModelOptions<TData> {
  readonly rowKey: PivotFieldAccessor<TData>;
  readonly columnKey: PivotFieldAccessor<TData>;
  readonly valueKey: PivotFieldAccessor<TData>;
  readonly aggregate?: AggregationType;
}

export interface PivotModel {
  readonly rowKeys: readonly string[];
  readonly columnKeys: readonly string[];
  readonly matrix: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly rowTotals: Readonly<Record<string, number>>;
  readonly columnTotals: Readonly<Record<string, number>>;
  readonly grandTotal: number;
}

function readPivotField<TData>(row: TData, accessor: PivotFieldAccessor<TData>): unknown {
  if (typeof accessor === 'function') return accessor(row);
  if (row !== null && typeof row === 'object') {
    const record = row as unknown as Record<string, unknown>;
    const getValue = record['getValue'];
    if (typeof getValue === 'function') {
      return (getValue as (id: string) => unknown).call(row, accessor);
    }
    return record[accessor];
  }
  return undefined;
}

function normalizePivotKey(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Builds a 2D pivot matrix with row totals, column totals, and a grand total
 * using `aggregateNumeric` from `./columns-and-export`.
 */
export function createPivotModel<TData>(
  rows: readonly TData[],
  options: PivotModelOptions<TData>,
): PivotModel {
  const aggregate: AggregationType = options.aggregate ?? 'sum';
  const rowKeys: string[] = [];
  const rowKeySet = new Set<string>();
  const columnKeys: string[] = [];
  const columnKeySet = new Set<string>();

  const cellBuckets = new Map<string, Map<string, unknown[]>>();
  const rowBuckets = new Map<string, unknown[]>();
  const columnBuckets = new Map<string, unknown[]>();
  const allValues: unknown[] = [];

  for (const row of rows) {
    const rKey = normalizePivotKey(readPivotField(row, options.rowKey));
    const cKey = normalizePivotKey(readPivotField(row, options.columnKey));
    const value = readPivotField(row, options.valueKey);

    if (!rowKeySet.has(rKey)) {
      rowKeySet.add(rKey);
      rowKeys.push(rKey);
    }
    if (!columnKeySet.has(cKey)) {
      columnKeySet.add(cKey);
      columnKeys.push(cKey);
    }

    let rowMap = cellBuckets.get(rKey);
    if (!rowMap) {
      rowMap = new Map<string, unknown[]>();
      cellBuckets.set(rKey, rowMap);
    }
    let cellValues = rowMap.get(cKey);
    if (!cellValues) {
      cellValues = [];
      rowMap.set(cKey, cellValues);
    }
    cellValues.push(value);

    let rBucket = rowBuckets.get(rKey);
    if (!rBucket) {
      rBucket = [];
      rowBuckets.set(rKey, rBucket);
    }
    rBucket.push(value);

    let cBucket = columnBuckets.get(cKey);
    if (!cBucket) {
      cBucket = [];
      columnBuckets.set(cKey, cBucket);
    }
    cBucket.push(value);

    allValues.push(value);
  }

  const matrix: Record<string, Readonly<Record<string, number>>> = {};
  const rowTotals: Record<string, number> = {};
  for (const rKey of rowKeys) {
    const rowRecord: Record<string, number> = {};
    const rowMap = cellBuckets.get(rKey);
    for (const cKey of columnKeys) {
      const values = rowMap?.get(cKey) ?? [];
      rowRecord[cKey] = aggregateNumeric(values, aggregate);
    }
    matrix[rKey] = Object.freeze(rowRecord);
    rowTotals[rKey] = aggregateNumeric(rowBuckets.get(rKey) ?? [], aggregate);
  }

  const columnTotals: Record<string, number> = {};
  for (const cKey of columnKeys) {
    columnTotals[cKey] = aggregateNumeric(columnBuckets.get(cKey) ?? [], aggregate);
  }

  return Object.freeze({
    rowKeys: Object.freeze(rowKeys),
    columnKeys: Object.freeze(columnKeys),
    matrix: Object.freeze(matrix),
    rowTotals: Object.freeze(rowTotals),
    columnTotals: Object.freeze(columnTotals),
    grandTotal: aggregateNumeric(allValues, aggregate),
  });
}

export interface CellCoord {
  readonly row: number;
  readonly col: number;
}

export interface NormalizedCellRange {
  readonly startRow: number;
  readonly endRow: number;
  readonly startCol: number;
  readonly endCol: number;
}

function normalizeCoord(row: number, col: number): CellCoord | null {
  if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
  return Object.freeze({ row: Math.max(0, Math.trunc(row)), col: Math.max(0, Math.trunc(col)) });
}

/**
 * Rectangular spreadsheet-style cell range selection manager with anchor/focus tracking.
 */
export class CellRangeSelectionManager {
  private anchorCell: CellCoord | null = null;
  private focusCell: CellCoord | null = null;

  get anchor(): CellCoord | null {
    return this.anchorCell;
  }

  get focus(): CellCoord | null {
    return this.focusCell;
  }

  get range(): NormalizedCellRange | null {
    if (!this.anchorCell || !this.focusCell) return null;
    return Object.freeze({
      startRow: Math.min(this.anchorCell.row, this.focusCell.row),
      endRow: Math.max(this.anchorCell.row, this.focusCell.row),
      startCol: Math.min(this.anchorCell.col, this.focusCell.col),
      endCol: Math.max(this.anchorCell.col, this.focusCell.col),
    });
  }

  start(row: number, col: number): void {
    const coord = normalizeCoord(row, col);
    if (!coord) return;
    this.anchorCell = coord;
    this.focusCell = coord;
  }

  select(row: number, col: number): void {
    this.start(row, col);
  }

  expand(row: number, col: number): void {
    const coord = normalizeCoord(row, col);
    if (!coord) return;
    if (!this.anchorCell) this.anchorCell = coord;
    this.focusCell = coord;
  }

  expandBy(rowDelta: number, colDelta: number): void {
    if (!this.focusCell || !Number.isFinite(rowDelta) || !Number.isFinite(colDelta)) return;
    this.expand(this.focusCell.row + Math.trunc(rowDelta), this.focusCell.col + Math.trunc(colDelta));
  }

  isSelected(row: number, col: number): boolean {
    const bounds = this.range;
    if (!bounds) return false;
    return (
      row >= bounds.startRow &&
      row <= bounds.endRow &&
      col >= bounds.startCol &&
      col <= bounds.endCol
    );
  }

  getSelectedCells(): CellCoord[] {
    const bounds = this.range;
    if (!bounds) return [];
    const cells: CellCoord[] = [];
    for (let r = bounds.startRow; r <= bounds.endRow; r += 1) {
      for (let c = bounds.startCol; c <= bounds.endCol; c += 1) {
        cells.push(Object.freeze({ row: r, col: c }));
      }
    }
    return cells;
  }

  clear(): void {
    this.anchorCell = null;
    this.focusCell = null;
  }
}

export function createCellRangeSelectionManager(): CellRangeSelectionManager {
  return new CellRangeSelectionManager();
}

function escapeTsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes('\t') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/gu, '""')}"`;
  }
  return str;
}

/** Serializes a 2D cell selection matrix into spreadsheet-compatible TSV text. */
export function serializeSelectionToTsv(matrix: readonly (readonly unknown[])[]): string {
  return matrix.map((row) => row.map((cell) => escapeTsvCell(cell)).join('\t')).join('\n');
}

/** Parses spreadsheet TSV clipboard text (supporting quoted cells, CRLF/LF, and escaped quotes). */
export function parseTsvClipboard(tsv: string): string[][] {
  if (tsv.length === 0) return [];
  const normalized = tsv.endsWith('\r\n')
    ? tsv.slice(0, -2)
    : tsv.endsWith('\n')
      ? tsv.slice(0, -1)
      : tsv;
  if (normalized.length === 0) return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"' && field.length === 0) {
      inQuotes = true;
    } else if (ch === '\t') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      if (normalized[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  row.push(field);
  rows.push(row);
  return rows;
}

/** Immutably reorders columns by moving the column matching `fromId` to the position of `toId`. */
export function reorderColumns<TData>(
  columns: readonly DataGridColumn<TData>[],
  fromId: string,
  toId: string,
): DataGridColumn<TData>[] {
  if (fromId === toId) return [...columns];
  const fromIndex = columns.findIndex((column) => column.id === fromId);
  const toIndex = columns.findIndex((column) => column.id === toId);
  if (fromIndex < 0 || toIndex < 0) return [...columns];
  const next = [...columns];
  const [moved] = next.splice(fromIndex, 1);
  if (moved !== undefined) next.splice(toIndex, 0, moved);
  return next;
}
