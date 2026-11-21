# @forma-ui/data-grid

Framework-neutral data model for tables and grids. It is intentionally not a renderer or a replacement for TanStack Table. The package offers a compact model with stable row identity, multi-sort, column/global filtering, pagination, visibility and row selection, and exposes ARIA-oriented props for a renderer.

## Accessibility integration

Prefer native `<table>` semantics for ordinary tabular data. Use `role="grid"` only when the interface provides a composite keyboard interaction model. Sort controls must be actual buttons inside column headers; do not make a non-focusable header clickable. The model provides `getSortButtonProps` for that purpose. The consuming renderer must still implement row/cell focus and announce asynchronous loading/errors.

## Example

```ts
import { createDataGrid } from '@forma-ui/data-grid';

const grid = createDataGrid({
  data: [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Grace' }],
  columns: [{ id: 'name', header: 'Name', accessorKey: 'name' }],
  getRowId: (row) => row.id,
  locale: 'en-GB',
});
grid.toggleSorting('name');
const visibleRows = grid.getPaginationRowModel();
grid.destroy();
```

## Build and tests

```bash
pnpm --filter @forma-ui/data-grid build
pnpm --filter @forma-ui/data-grid test
```
