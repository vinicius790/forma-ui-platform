import type { DataGridColumn, DataGridRow } from './index';

export type PinPosition = 'left' | 'right' | false;
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface ColumnPinningState {
  left: string[];
  right: string[];
}

export function partitionPinnedColumns<TData>(
  columns: readonly DataGridColumn<TData>[],
  pinning: Partial<ColumnPinningState>,
): { left: DataGridColumn<TData>[]; center: DataGridColumn<TData>[]; right: DataGridColumn<TData>[] } {
  const leftSet = new Set(pinning.left ?? []);
  const rightSet = new Set((pinning.right ?? []).filter((id) => !leftSet.has(id)));
  const left: DataGridColumn<TData>[] = [];
  const center: DataGridColumn<TData>[] = [];
  const right: DataGridColumn<TData>[] = [];
  for (const col of columns) {
    if (leftSet.has(col.id)) left.push(col);
    else if (rightSet.has(col.id)) right.push(col);
    else center.push(col);
  }
  return { left, center, right };
}

export interface ColumnSizingOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  initialWidths?: Readonly<Record<string, number>>;
}

export class ColumnSizingManager {
  private widths: Record<string, number>;
  private defaultWidth: number;
  private minWidth: number;
  private maxWidth: number;

  constructor(options: ColumnSizingOptions = {}) {
    this.defaultWidth = options.defaultWidth ?? 160;
    this.minWidth = options.minWidth ?? 60;
    this.maxWidth = options.maxWidth ?? 800;
    this.widths = { ...(options.initialWidths ?? {}) };
  }

  getWidth(columnId: string): number {
    return this.widths[columnId] ?? this.defaultWidth;
  }

  setWidth(columnId: string, width: number): number {
    const clamped = Math.min(this.maxWidth, Math.max(this.minWidth, Math.round(width)));
    this.widths[columnId] = clamped;
    return clamped;
  }

  resizeBy(columnId: string, delta: number): number {
    return this.setWidth(columnId, this.getWidth(columnId) + delta);
  }

  getTotalWidth(columnIds: readonly string[]): number {
    return columnIds.reduce((sum, id) => sum + this.getWidth(id), 0);
  }

  snapshot(): Readonly<Record<string, number>> {
    return Object.freeze({ ...this.widths });
  }
}

export function createColumnSizingManager(options: ColumnSizingOptions = {}): ColumnSizingManager {
  return new ColumnSizingManager(options);
}

export interface GroupedRowBucket<TData> {
  key: string;
  value: unknown;
  rows: readonly DataGridRow<TData>[];
  aggregates: Readonly<Record<string, number>>;
}

export function aggregateNumeric(values: readonly unknown[], fn: AggregationType): number {
  if (fn === 'count') return values.length;
  const nums = values.map((v) => (typeof v === 'number' ? v : Number(v))).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return 0;
  if (fn === 'sum') return nums.reduce((a, b) => a + b, 0);
  if (fn === 'avg') return nums.reduce((a, b) => a + b, 0) / nums.length;
  if (fn === 'min') return Math.min(...nums);
  return Math.max(...nums);
}

export function groupAndAggregateRows<TData>(
  rows: readonly DataGridRow<TData>[],
  groupByColumnId: string,
  aggregations: Readonly<Record<string, AggregationType>> = {},
): GroupedRowBucket<TData>[] {
  const buckets = new Map<string, { value: unknown; rows: DataGridRow<TData>[] }>();
  for (const row of rows) {
    const val = row.getValue(groupByColumnId);
    const key = val === null || val === undefined ? '' : String(val);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { value: val, rows: [] };
      buckets.set(key, bucket);
    }
    bucket.rows.push(row);
  }
  const result: GroupedRowBucket<TData>[] = [];
  for (const [key, bucket] of buckets) {
    const aggregates: Record<string, number> = {};
    for (const [colId, fn] of Object.entries(aggregations)) {
      aggregates[colId] = aggregateNumeric(bucket.rows.map((r) => r.getValue(colId)), fn);
    }
    result.push({ key, value: bucket.value, rows: bucket.rows, aggregates: Object.freeze(aggregates) });
  }
  return result;
}

export interface CellEditSession<TValue = unknown> {
  rowId: string;
  columnId: string;
  initialValue: TValue;
  draftValue: TValue;
}

export class InlineCellEditor<TValue = unknown> {
  private active: CellEditSession<TValue> | null = null;

  get session(): Readonly<CellEditSession<TValue>> | null {
    return this.active ? Object.freeze({ ...this.active }) : null;
  }

  isEditing(rowId: string, columnId: string): boolean {
    return this.active !== null && this.active.rowId === rowId && this.active.columnId === columnId;
  }

  start(rowId: string, columnId: string, initialValue: TValue): void {
    this.active = { rowId, columnId, initialValue, draftValue: initialValue };
  }

  updateDraft(nextValue: TValue): void {
    if (this.active) this.active = { ...this.active, draftValue: nextValue };
  }

  commit(): CellEditSession<TValue> | null {
    const result = this.active;
    this.active = null;
    return result;
  }

  cancel(): void {
    this.active = null;
  }
}

export function createInlineCellEditor<TValue = unknown>(): InlineCellEditor<TValue> {
  return new InlineCellEditor<TValue>();
}

function escapeCsvCell(value: unknown, delimiter: string): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(delimiter)) {
    return `"${str.replace(/"/gu, '""')}"`;
  }
  return str;
}

/** RFC 4180 compliant CSV serializer for DataGrid rows and visible columns. */
export function exportGridToCsv<TData>(
  rows: readonly DataGridRow<TData>[],
  columns: readonly DataGridColumn<TData>[],
  options: { delimiter?: string; includeHeader?: boolean } = {},
): string {
  const delimiter = options.delimiter ?? ',';
  const lines: string[] = [];
  if (options.includeHeader ?? true) {
    lines.push(columns.map((c) => escapeCsvCell(c.header, delimiter)).join(delimiter));
  }
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvCell(row.getValue(c.id), delimiter)).join(delimiter));
  }
  return lines.join('\r\n');
}

export function exportGridToJson<TData>(
  rows: readonly DataGridRow<TData>[],
  columns: readonly DataGridColumn<TData>[],
  pretty = false,
): string {
  const records = rows.map((row) =>
    Object.fromEntries(columns.map((col) => [col.id, row.getValue(col.id)])),
  );
  return JSON.stringify(records, null, pretty ? 2 : undefined);
}
