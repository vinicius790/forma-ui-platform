import { createGridController, type GridCell, type GridController } from '@forma-ui/core';

export type SortDirection = 'asc' | 'desc';
export interface SortingRule { id: string; direction: SortDirection }
export interface ColumnFilter { id: string; value: unknown }
export interface PaginationState { pageIndex: number; pageSize: number }
export interface DataGridState {
  sorting: readonly SortingRule[];
  columnFilters: readonly ColumnFilter[];
  globalFilter: string;
  pagination: Readonly<PaginationState>;
  rowSelection: Readonly<Record<string, boolean>>;
  columnVisibility: Readonly<Record<string, boolean>>;
}

export interface DataGridColumn<TData> {
  id: string;
  header: string;
  accessorKey?: keyof TData & string;
  accessorFn?: (row: TData) => unknown;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableHiding?: boolean;
  sortFn?: (left: unknown, right: unknown) => number;
  filterFn?: (value: unknown, filter: unknown, row: TData) => boolean;
}

export interface DataGridRow<TData> {
  id: string;
  index: number;
  original: TData;
  values: Readonly<Record<string, unknown>>;
  getValue: (columnId: string) => unknown;
}

export interface DataGridOptions<TData> {
  data: readonly TData[];
  columns: readonly DataGridColumn<TData>[];
  getRowId?: (row: TData, index: number) => string;
  locale?: string;
  pageSize?: number;
  initialState?: Partial<DataGridState>;
  onStateChange?: (state: DataGridState) => void;
}

const copyState = (state: DataGridState): DataGridState => ({
  sorting: state.sorting.map((item) => ({ ...item })),
  columnFilters: state.columnFilters.map((item) => ({ ...item })),
  globalFilter: state.globalFilter,
  pagination: { ...state.pagination },
  rowSelection: { ...state.rowSelection },
  columnVisibility: { ...state.columnVisibility },
});

function compareValues(left: unknown, right: unknown, collator: Intl.Collator): { value: number; fixedDirection: boolean } {
  if (Object.is(left, right)) return { value: 0, fixedDirection: false };
  // Nullish values and NaN remain last in both ascending and descending order.
  if (left === null || left === undefined) return { value: 1, fixedDirection: true };
  if (right === null || right === undefined) return { value: -1, fixedDirection: true };
  if (typeof left === 'number' && typeof right === 'number') {
    if (Number.isNaN(left)) return { value: Number.isNaN(right) ? 0 : 1, fixedDirection: true };
    if (Number.isNaN(right)) return { value: -1, fixedDirection: true };
    return { value: left - right, fixedDirection: false };
  }
  if (typeof left === 'bigint' && typeof right === 'bigint') return { value: left < right ? -1 : left > right ? 1 : 0, fixedDirection: false };
  if (typeof left === 'boolean' && typeof right === 'boolean') return { value: Number(left) - Number(right), fixedDirection: false };
  if (left instanceof Date && right instanceof Date) {
    const leftTime = left.getTime();
    const rightTime = right.getTime();
    if (Number.isNaN(leftTime)) return { value: Number.isNaN(rightTime) ? 0 : 1, fixedDirection: true };
    if (Number.isNaN(rightTime)) return { value: -1, fixedDirection: true };
    return { value: leftTime - rightTime, fixedDirection: false };
  }
  return { value: collator.compare(String(left), String(right)), fixedDirection: false };
}

/**
 * Framework-neutral table model. It deliberately does not render HTML and
 * never mutates caller-owned data. Provide getRowId for data that can reorder.
 */
export class DataGrid<TData> {
  private options: DataGridOptions<TData>;
  private state: DataGridState;
  private listeners = new Set<() => void>();
  private gridController?: GridController;
  private destroyed = false;
  private collator: Intl.Collator;

  constructor(options: DataGridOptions<TData>) {
    this.validateColumns(options.columns);
    this.options = { pageSize: 10, locale: 'en', ...options };
    this.collator = new Intl.Collator(this.options.locale, { numeric: true, sensitivity: 'base' });
    this.validateRows(this.options.data, this.options.getRowId);
    const initial = options.initialState ?? {};
    this.state = {
      sorting: (initial.sorting ?? []).map((item) => ({ ...item })),
      columnFilters: (initial.columnFilters ?? []).map((item) => ({ ...item })),
      globalFilter: initial.globalFilter ?? '',
      pagination: {
        pageIndex: Math.max(0, Math.floor(initial.pagination?.pageIndex ?? 0)),
        pageSize: this.normalizePageSize(initial.pagination?.pageSize ?? options.pageSize ?? 10),
      },
      rowSelection: { ...(initial.rowSelection ?? {}) },
      columnVisibility: { ...(initial.columnVisibility ?? {}) },
    };
  }

  getSnapshot = (): DataGridState => copyState(this.state);
  subscribe = (listener: () => void): (() => void) => {
    this.assertActive();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  updateOptions(options: Partial<Pick<DataGridOptions<TData>, 'data' | 'columns' | 'getRowId' | 'locale'>>): void {
    this.assertActive();
    if (options.columns) this.validateColumns(options.columns);
    const nextData = options.data ?? this.options.data;
    const nextGetRowId = options.getRowId ?? this.options.getRowId;
    this.validateRows(nextData, nextGetRowId);
    const nextOptions = { ...this.options, ...options };
    // Construct Intl.Collator before committing options so invalid locales leave
    // the current grid untouched.
    const nextCollator = options.locale
      ? new Intl.Collator(options.locale, { numeric: true, sensitivity: 'base' })
      : this.collator;
    this.options = nextOptions;
    this.collator = nextCollator;

    const columnIds = new Set(nextOptions.columns.map((column) => column.id));
    const sortableIds = new Set(nextOptions.columns.filter((column) => column.enableSorting !== false).map((column) => column.id));
    const filterableIds = new Set(nextOptions.columns.filter((column) => column.enableFiltering !== false).map((column) => column.id));
    const rowIds = new Set(nextOptions.data.map((row, index) => nextOptions.getRowId?.(row, index) ?? String(index)));
    this.state = {
      ...this.state,
      sorting: this.state.sorting.filter((rule) => sortableIds.has(rule.id)),
      columnFilters: this.state.columnFilters.filter((filter) => filterableIds.has(filter.id)),
      rowSelection: Object.fromEntries(Object.entries(this.state.rowSelection).filter(([id, selected]) => selected && rowIds.has(id))),
      columnVisibility: Object.fromEntries(Object.entries(this.state.columnVisibility).filter(([id]) => columnIds.has(id))),
    };
    const maximumPageIndex = Math.max(0, this.getPageCount() - 1);
    if (this.state.pagination.pageIndex > maximumPageIndex) {
      this.state = { ...this.state, pagination: { ...this.state.pagination, pageIndex: maximumPageIndex } };
    }
    if (this.gridController) this.syncGridController();
    this.publish();
  }

  getCoreRowModel(): DataGridRow<TData>[] {
    return this.options.data.map((original, index) => {
      const values: Record<string, unknown> = {};
      for (const column of this.options.columns) values[column.id] = this.getColumnValue(column, original);
      const id = this.options.getRowId?.(original, index) ?? String(index);
      return { id, index, original, values, getValue: (columnId: string) => values[columnId] };
    });
  }

  getFilteredRowModel(): DataGridRow<TData>[] {
    const filters = this.state.columnFilters;
    const query = normalize(this.state.globalFilter, this.options.locale);
    const searchable = this.getVisibleColumns().filter((column) => column.enableFiltering !== false);
    return this.getCoreRowModel().filter((row) => {
      const columnsMatch = filters.every((filter) => {
        const column = this.options.columns.find((entry) => entry.id === filter.id);
        if (!column || column.enableFiltering === false) return true;
        const value = row.getValue(filter.id);
        return column.filterFn ? column.filterFn(value, filter.value, row.original) : normalize(String(value ?? ''), this.options.locale).includes(normalize(String(filter.value ?? ''), this.options.locale));
      });
      if (!columnsMatch || !query) return columnsMatch;
      return searchable.some((column) => normalize(String(row.getValue(column.id) ?? ''), this.options.locale).includes(query));
    });
  }

  getSortedRowModel(): DataGridRow<TData>[] {
    const sorting = this.state.sorting.filter((rule) => this.options.columns.some((column) => column.id === rule.id && column.enableSorting !== false));
    if (!sorting.length) return this.getFilteredRowModel();
    return this.getFilteredRowModel().map((row, index) => ({ row, index })).sort((left, right) => {
      for (const rule of sorting) {
        const column = this.options.columns.find((entry) => entry.id === rule.id)!;
        const leftValue = left.row.getValue(rule.id);
        const rightValue = right.row.getValue(rule.id);
        const customComparison = column.sortFn?.(leftValue, rightValue);
        const comparison = column.sortFn
          ? { value: typeof customComparison === 'number' && Number.isFinite(customComparison) ? customComparison : 0, fixedDirection: false }
          : compareValues(leftValue, rightValue, this.collator);
        if (comparison.value !== 0) {
          return comparison.fixedDirection ? comparison.value : (rule.direction === 'desc' ? -1 : 1) * comparison.value;
        }
      }
      return left.index - right.index;
    }).map(({ row }) => row);
  }

  getPaginationRowModel(): DataGridRow<TData>[] {
    const rows = this.getSortedRowModel();
    const start = this.state.pagination.pageIndex * this.state.pagination.pageSize;
    return rows.slice(start, start + this.state.pagination.pageSize);
  }

  getRowCount(): number { return this.getSortedRowModel().length; }
  getPageCount(): number { return Math.ceil(this.getRowCount() / this.state.pagination.pageSize); }
  getCanPreviousPage(): boolean { return this.state.pagination.pageIndex > 0; }
  getCanNextPage(): boolean { return this.state.pagination.pageIndex + 1 < this.getPageCount(); }
  getVisibleColumns(): DataGridColumn<TData>[] { return this.options.columns.filter((column) => this.state.columnVisibility[column.id] !== false); }

  setSorting(sorting: readonly SortingRule[]): void {
    this.assertActive();
    const allowed = new Set(this.options.columns.filter((column) => column.enableSorting !== false).map((column) => column.id));
    const seen = new Set<string>();
    const normalized = sorting.filter((rule) => {
      if (!allowed.has(rule.id) || seen.has(rule.id) || !['asc', 'desc'].includes(rule.direction)) return false;
      seen.add(rule.id);
      return true;
    }).map((rule) => ({ ...rule }));
    this.state = { ...this.state, sorting: normalized };
    this.resetPage();
    this.publish();
  }

  toggleSorting(columnId: string, multi = false): void {
    this.assertActive();
    const column = this.options.columns.find((entry) => entry.id === columnId);
    if (!column || column.enableSorting === false) return;
    const current = this.state.sorting.find((rule) => rule.id === columnId);
    const nextDirection: SortDirection | undefined = !current ? 'asc' : current.direction === 'asc' ? 'desc' : undefined;
    const rest = multi ? this.state.sorting.filter((rule) => rule.id !== columnId) : [];
    this.setSorting(nextDirection ? [...rest, { id: columnId, direction: nextDirection }] : rest);
  }

  setColumnFilters(filters: readonly ColumnFilter[]): void {
    this.assertActive();
    const allowed = new Set(this.options.columns.map((column) => column.id));
    const byId = new Map<string, ColumnFilter>();
    for (const filter of filters) if (allowed.has(filter.id)) byId.set(filter.id, { ...filter });
    this.state = { ...this.state, columnFilters: [...byId.values()] };
    this.resetPage();
    this.publish();
  }

  setColumnFilter(id: string, value: unknown): void {
    const filters = this.state.columnFilters.filter((filter) => filter.id !== id);
    if (value !== undefined && value !== null && value !== '') filters.push({ id, value });
    this.setColumnFilters(filters);
  }

  setGlobalFilter(value: string): void {
    this.assertActive();
    this.state = { ...this.state, globalFilter: value };
    this.resetPage();
    this.publish();
  }

  setPageIndex(pageIndex: number): void {
    this.assertActive();
    const maximum = Math.max(0, this.getPageCount() - 1);
    const requested = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : 0;
    this.state = { ...this.state, pagination: { ...this.state.pagination, pageIndex: Math.max(0, Math.min(maximum, requested)) } };
    this.syncGridController();
    this.publish();
  }

  setPageSize(pageSize: number): void {
    this.assertActive();
    const nextSize = this.normalizePageSize(pageSize);
    this.state = { ...this.state, pagination: { pageIndex: 0, pageSize: nextSize } };
    this.syncGridController();
    this.publish();
  }

  nextPage(): void { if (this.getCanNextPage()) this.setPageIndex(this.state.pagination.pageIndex + 1); }
  previousPage(): void { if (this.getCanPreviousPage()) this.setPageIndex(this.state.pagination.pageIndex - 1); }

  setColumnVisibility(id: string, visible: boolean): void {
    this.assertActive();
    const column = this.options.columns.find((entry) => entry.id === id);
    if (!column || column.enableHiding === false) return;
    this.state = { ...this.state, columnVisibility: { ...this.state.columnVisibility, [id]: visible } };
    this.publish();
  }

  toggleRowSelected(id: string, selected?: boolean): void {
    this.assertActive();
    if (!this.options.data.some((row, index) => (this.options.getRowId?.(row, index) ?? String(index)) === id)) return;
    const next = { ...this.state.rowSelection };
    const value = selected ?? !next[id];
    if (value) next[id] = true; else delete next[id];
    this.state = { ...this.state, rowSelection: next };
    this.publish();
  }

  toggleAllPageRowsSelected(selected?: boolean): void {
    this.assertActive();
    const rows = this.getPaginationRowModel();
    const next = { ...this.state.rowSelection };
    const value = selected ?? !rows.every((row) => next[row.id]);
    for (const row of rows) { if (value) next[row.id] = true; else delete next[row.id]; }
    this.state = { ...this.state, rowSelection: next };
    this.publish();
  }

  getIsAllPageRowsSelected(): boolean {
    const rows = this.getPaginationRowModel();
    return rows.length > 0 && rows.every((row) => this.state.rowSelection[row.id]);
  }

  getIsSomePageRowsSelected(): boolean {
    const rows = this.getPaginationRowModel();
    const count = rows.filter((row) => this.state.rowSelection[row.id]).length;
    return count > 0 && count < rows.length;
  }

  getGridProps(label = 'Data grid') {
    return {
      role: 'grid' as const,
      'aria-label': label,
      'aria-rowcount': this.getRowCount() + 1,
      'aria-colcount': this.getVisibleColumns().length,
      'data-forma-grid': '',
    };
  }

  getHeaderProps(columnId: string) {
    const column = this.options.columns.find((entry) => entry.id === columnId);
    const sorting = this.state.sorting.find((rule) => rule.id === columnId);
    const visibleIndex = this.getVisibleColumns().findIndex((entry) => entry.id === columnId);
    const ariaSort: 'ascending' | 'descending' | 'none' = sorting ? (sorting.direction === 'asc' ? 'ascending' : 'descending') : 'none';
    return {
      role: 'columnheader' as const,
      'aria-sort': ariaSort,
      'aria-colindex': visibleIndex >= 0 ? visibleIndex + 1 : undefined,
      'data-sortable': column && column.enableSorting !== false ? '' : undefined,
    };
  }

  /** Use this on a real button nested inside the columnheader; never make a non-focusable header clickable. */
  getSortButtonProps(columnId: string) {
    const column = this.options.columns.find((entry) => entry.id === columnId);
    const current = this.state.sorting.find((rule) => rule.id === columnId);
    const nextLabel = !current ? 'ascending' : current.direction === 'asc' ? 'descending' : 'remove sorting';
    return {
      type: 'button' as const,
      disabled: !column || column.enableSorting === false,
      'aria-label': column ? `${column.header}: ${nextLabel}` : 'Sorting unavailable',
      'data-forma-sort-button': '',
      onClick: () => this.toggleSorting(columnId),
    };
  }

  getHeaderSelectionCheckboxProps() {
    const all = this.getIsAllPageRowsSelected();
    const some = this.getIsSomePageRowsSelected();
    return {
      type: 'checkbox' as const,
      checked: all,
      'aria-label': 'Select all rows on this page',
      'aria-checked': some ? 'mixed' as const : all,
      'data-indeterminate': some ? '' : undefined,
      onChange: (event: { currentTarget?: { checked?: boolean }; target?: { checked?: boolean } }) => {
        const target = event.currentTarget ?? event.target;
        this.toggleAllPageRowsSelected(Boolean(target?.checked));
      },
    };
  }

  getRowSelectionCheckboxProps(row: DataGridRow<TData>) {
    return {
      type: 'checkbox' as const,
      checked: Boolean(this.state.rowSelection[row.id]),
      'aria-label': `Select row ${row.id}`,
      onChange: (event: { currentTarget?: { checked?: boolean }; target?: { checked?: boolean } }) => {
        const target = event.currentTarget ?? event.target;
        this.toggleRowSelected(row.id, Boolean(target?.checked));
      },
    };
  }

  getRowProps(row: DataGridRow<TData>) {
    const visibleIndex = this.getPaginationRowModel().findIndex((entry) => entry.id === row.id);
    return {
      role: 'row' as const,
      'aria-rowindex': visibleIndex >= 0 ? visibleIndex + 2 : undefined,
      'aria-selected': Boolean(this.state.rowSelection[row.id]) || undefined,
      'data-row-id': row.id,
    };
  }

  getCellProps(row: DataGridRow<TData>, column: DataGridColumn<TData>) {
    const visibleIndex = this.getVisibleColumns().findIndex((entry) => entry.id === column.id);
    const visibleRowIndex = this.getPaginationRowModel().findIndex((entry) => entry.id === row.id);
    return {
      role: 'gridcell' as const,
      'aria-colindex': visibleIndex >= 0 ? visibleIndex + 1 : undefined,
      'aria-rowindex': visibleRowIndex >= 0 ? visibleRowIndex + 2 : undefined,
      'data-column-id': column.id,
      'data-row-id': row.id,
    };
  }

  getGridController(): GridController {
    this.assertActive();
    if (!this.gridController) {
      this.gridController = createGridController({ rows: Math.max(1, this.getPaginationRowModel().length), columns: Math.max(1, this.getVisibleColumns().length), selectionMode: 'none' });
    }
    return this.gridController;
  }

  getVisibleGridCell(rowIndex: number, visibleColumnIndex: number): GridCell {
    return { row: rowIndex, column: visibleColumnIndex };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.gridController?.destroy();
    this.gridController = undefined;
    this.listeners.clear();
  }

  private validateRows(data: readonly TData[], getRowId?: (row: TData, index: number) => string): void {
    const ids = new Set<string>();
    data.forEach((row, index) => {
      const id = getRowId?.(row, index) ?? String(index);
      if (typeof id !== 'string' || !id.trim()) throw new TypeError('Data grid row IDs must be non-empty strings.');
      if (ids.has(id)) throw new TypeError(`Duplicate data grid row ID: ${id}`);
      ids.add(id);
    });
  }

  private getColumnValue(column: DataGridColumn<TData>, row: TData): unknown {
    if (column.accessorFn) return column.accessorFn(row);
    if (column.accessorKey) return row[column.accessorKey];
    return undefined;
  }

  private validateColumns(columns: readonly DataGridColumn<TData>[]): void {
    const ids = new Set<string>();
    for (const column of columns) {
      if (typeof column.id !== 'string' || !column.id.trim()) throw new TypeError('Data grid column IDs must be non-empty strings.');
      if (ids.has(column.id)) throw new TypeError(`Duplicate data grid column ID: ${column.id}`);
      if (!column.accessorFn && !column.accessorKey) throw new TypeError(`Column ${column.id} requires accessorKey or accessorFn.`);
      ids.add(column.id);
    }
  }

  private normalizePageSize(value: number): number {
    if (!Number.isFinite(value) || value < 1) throw new RangeError('pageSize must be a positive finite number.');
    return Math.min(10000, Math.floor(value));
  }
  private resetPage(): void { this.state = { ...this.state, pagination: { ...this.state.pagination, pageIndex: 0 } }; }
  private syncGridController(): void {
    if (!this.gridController) return;
    this.gridController.updateOptions({ rows: Math.max(1, this.getPaginationRowModel().length), columns: Math.max(1, this.getVisibleColumns().length) });
  }
  private publish(): void {
    const snapshot = this.getSnapshot();
    this.options.onStateChange?.(snapshot);
    for (const listener of [...this.listeners]) listener();
  }
  private assertActive(): void { if (this.destroyed) throw new Error('DataGrid has been destroyed.'); }
}

function normalize(value: string, locale = 'en'): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase(locale).trim();
}

export function createDataGrid<TData>(options: DataGridOptions<TData>): DataGrid<TData> {
  return new DataGrid(options);
}

export * from './columns-and-export';
export * from './tree-pivot-and-clipboard';
