import { describe, expect, it, vi } from 'vitest';
import { createDataGrid } from '../index';

type Person = { id: string; name: string; score: number | null };
const data: Person[] = [
  { id: 'a', name: 'Ágata', score: 10 },
  { id: 'b', name: 'Ada', score: null },
  { id: 'c', name: 'Grace', score: 20 },
  { id: 'd', name: 'Alan', score: 10 },
];
const columns = [
  { id: 'name', header: 'Name', accessorKey: 'name' as const },
  { id: 'score', header: 'Score', accessorKey: 'score' as const },
];

describe('DataGrid row models', () => {
  it('sorts stably and keeps nulls last in both directions', () => {
    const grid = createDataGrid({ data, columns, getRowId: (row) => row.id });
    grid.setSorting([{ id: 'score', direction: 'desc' }]);
    expect(grid.getSortedRowModel().map((row) => row.id)).toEqual(['c', 'a', 'd', 'b']);
    grid.setSorting([{ id: 'score', direction: 'asc' }]);
    expect(grid.getSortedRowModel().map((row) => row.id)).toEqual(['a', 'd', 'c', 'b']);
    grid.destroy();
  });

  it('filters text without diacritic sensitivity and paginates safely', () => {
    const grid = createDataGrid({ data, columns, getRowId: (row) => row.id, pageSize: 2, locale: 'pt-BR' });
    grid.setGlobalFilter('agata');
    expect(grid.getPaginationRowModel().map((row) => row.id)).toEqual(['a']);
    grid.setGlobalFilter('');
    grid.setPageIndex(Number.NaN);
    expect(grid.getSnapshot().pagination.pageIndex).toBe(0);
    grid.setPageSize(2);
    grid.nextPage();
    expect(grid.getSnapshot().pagination.pageIndex).toBe(1);
    grid.destroy();
  });

  it('validates stable unique row and column identities', () => {
    expect(() => createDataGrid({ data, columns, getRowId: () => 'same' })).toThrow(/Duplicate data grid row ID/u);
    expect(() => createDataGrid({ data, columns: [columns[0]!, columns[0]!] })).toThrow(/Duplicate data grid column ID/u);
  });

  it('uses a keyboard-operable sort button rather than click-only column headers', () => {
    const grid = createDataGrid({ data, columns, getRowId: (row) => row.id });
    expect(grid.getHeaderProps('name')).not.toHaveProperty('onClick');
    expect(grid.getHeaderProps('missing')['data-sortable']).toBeUndefined();
    const sortButton = grid.getSortButtonProps('name');
    expect(sortButton.type).toBe('button');
    sortButton.onClick();
    expect(grid.getHeaderProps('name')['aria-sort']).toBe('ascending');
    grid.destroy();
  });

  it('exposes selection checkboxes and grid row metadata', () => {
    const grid = createDataGrid({ data, columns, getRowId: (row) => row.id, pageSize: 2 });
    const rows = grid.getPaginationRowModel();
    grid.getRowSelectionCheckboxProps(rows[0]!).onChange({ currentTarget: { checked: true } });
    expect(grid.getSnapshot().rowSelection['a']).toBe(true);
    grid.toggleRowSelected('d', true);
    expect(grid.getHeaderSelectionCheckboxProps()['aria-checked']).toBe('mixed');
    expect(grid.getGridProps()['aria-rowcount']).toBe(5);
    expect(grid.getRowProps(rows[0]!)['aria-rowindex']).toBe(2);
    const callback = vi.fn();
    grid.subscribe(callback);
    grid.nextPage();
    expect(callback).toHaveBeenCalledOnce();
    grid.destroy();
  });
  it('prunes stale selection, sorting, filters and visibility after replacing data and columns', () => {
    const grid = createDataGrid({ data, columns, getRowId: (row) => row.id, pageSize: 1 });
    grid.setSorting([{ id: 'score', direction: 'desc' }]);
    grid.setColumnFilter('name', 'a');
    grid.setColumnVisibility('score', false);
    grid.toggleRowSelected('b', true);
    grid.toggleRowSelected('d', true);
    grid.setPageIndex(3);

    grid.updateOptions({
      data: data.slice(0, 1),
      columns: [columns[0]!],
    });

    const state = grid.getSnapshot();
    expect(state.sorting).toEqual([]);
    expect(state.columnFilters).toEqual([{ id: 'name', value: 'a' }]);
    expect(state.columnVisibility).toEqual({});
    expect(state.rowSelection).toEqual({});
    expect(state.pagination.pageIndex).toBe(0);
    grid.destroy();
  });

  it('does not mutate existing options when an invalid locale is supplied', () => {
    const grid = createDataGrid({ data, columns, getRowId: (row) => row.id, locale: 'en' });
    expect(() => grid.updateOptions({ locale: 'not_a_locale_###' })).toThrow();
    expect(grid.getCoreRowModel()).toHaveLength(data.length);
    grid.setSorting([{ id: 'name', direction: 'asc' }]);
    expect(grid.getSnapshot().sorting).toEqual([{ id: 'name', direction: 'asc' }]);
    expect(grid.getSortedRowModel()).toHaveLength(data.length);
    grid.destroy();
  });

});
