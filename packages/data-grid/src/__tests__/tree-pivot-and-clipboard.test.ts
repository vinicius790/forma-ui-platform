import { describe, expect, it } from 'vitest';
import {
  createCellRangeSelectionManager,
  createPivotModel,
  flattenTreeRows,
  parseTsvClipboard,
  reorderColumns,
  serializeSelectionToTsv,
  type DataGridColumn,
} from '../index';

describe('data-grid v50 extensions', () => {
  it('flattens expanded hierarchical tree rows with depth and parent metadata', () => {
    interface Node { id: string; children?: Node[] }
    const roots: Node[] = [
      { id: 'r1', children: [{ id: 'c1', children: [{ id: 'g1' }] }, { id: 'c2' }] },
      { id: 'r2' },
    ];
    const collapsed = flattenTreeRows(roots, (n) => n.children, new Set(), (n) => n.id);
    expect(collapsed.map((r) => [r.id, r.depth, r.hasChildren, r.isExpanded, r.parentId])).toEqual([
      ['r1', 0, true, false, null],
      ['r2', 0, false, false, null],
    ]);

    const expanded = flattenTreeRows(roots, (n) => n.children, new Set(['r1', 'c1']), (n) => n.id);
    expect(expanded.map((r) => [r.id, r.depth, r.parentId])).toEqual([
      ['r1', 0, null],
      ['c1', 1, 'r1'],
      ['g1', 2, 'c1'],
      ['c2', 1, 'r1'],
      ['r2', 0, null],
    ]);
  });

  it('builds a 2D pivot matrix with row, column, and grand totals', () => {
    const model = createPivotModel(
      [
        { region: 'NA', quarter: 'Q1', amount: 100 },
        { region: 'NA', quarter: 'Q1', amount: 50 },
        { region: 'NA', quarter: 'Q2', amount: 200 },
        { region: 'EU', quarter: 'Q1', amount: 80 },
      ],
      { rowKey: 'region', columnKey: 'quarter', valueKey: 'amount', aggregate: 'sum' },
    );
    expect(model.rowKeys).toEqual(['NA', 'EU']);
    expect(model.columnKeys).toEqual(['Q1', 'Q2']);
    expect(model.matrix['NA']?.['Q1']).toBe(150);
    expect(model.matrix['EU']?.['Q2']).toBe(0);
    expect(model.rowTotals['NA']).toBe(350);
    expect(model.columnTotals['Q1']).toBe(230);
    expect(model.grandTotal).toBe(430);
  });

  it('tracks rectangular cell selection and round-trips TSV clipboard payloads', () => {
    const selection = createCellRangeSelectionManager();
    expect(selection.isSelected(0, 0)).toBe(false);
    selection.start(2, 3);
    selection.expand(1, 1);
    expect(selection.isSelected(1, 1)).toBe(true);
    expect(selection.isSelected(2, 2)).toBe(true);
    expect(selection.isSelected(0, 2)).toBe(false);
    expect(selection.getSelectedCells()).toHaveLength(6);
    selection.clear();
    expect(selection.range).toBeNull();

    const tsv = serializeSelectionToTsv([
      ['A', 'Line1\nLine2'],
      ['Tab\t"Q"', 42],
    ]);
    expect(parseTsvClipboard(tsv)).toEqual([
      ['A', 'Line1\nLine2'],
      ['Tab\t"Q"', '42'],
    ]);
    expect(parseTsvClipboard('1\t2\r\n3\t4\r\n')).toEqual([['1', '2'], ['3', '4']]);
  });

  it('immutably reorders columns by ID', () => {
    type Row = { a: string; b: string; c: string };
    const cols: DataGridColumn<Row>[] = [
      { id: 'a', header: 'A', accessorKey: 'a' },
      { id: 'b', header: 'B', accessorKey: 'b' },
      { id: 'c', header: 'C', accessorKey: 'c' },
    ];
    const reordered = reorderColumns(cols, 'a', 'c');
    expect(reordered.map((c) => c.id)).toEqual(['b', 'c', 'a']);
    expect(cols.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(reorderColumns(cols, 'missing', 'a').map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});
