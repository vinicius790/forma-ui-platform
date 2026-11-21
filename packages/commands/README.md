# @forma-ui/commands

Framework-neutral command-palette state and fuzzy ranking. The package does not render a dialog: compose `CommandPaletteController` with `@forma-ui/core`'s Dialog and a listbox renderer in the host framework.

## Capabilities

- Unicode normalization and locale-aware case folding for queries.
- Exact, prefix, substring and subsequence scoring with deterministic tie-breaking.
- Bounded result sets and explicit disabled-item handling.
- Async providers receive an `AbortSignal`; stale responses are ignored even when a provider does not honor cancellation.
- Keyboard navigation (Arrow Up/Down, Home/End, Enter and Escape), active-descendant IDs and subscription lifecycle.
- Async command actions expose errors in the controller snapshot instead of creating unhandled rejections.

## Example

```ts
import { createCommandPaletteController } from '@forma-ui/commands';

const palette = createCommandPaletteController({
  items: [
    { id: 'settings', label: 'Open settings', keywords: ['preferences'] },
    { id: 'export', label: 'Export report', keywords: ['download'] },
  ],
  onSelect: (item) => console.log(item.id),
});

palette.openPalette();
await palette.setQuery('pref');
palette.getSnapshot();
palette.destroy();
```

The consumer is responsible for rendering, accessible naming, focus management and composing the controller with a modal Dialog when the palette is modal.

## Build and tests

```bash
pnpm --filter @forma-ui/commands build
pnpm --filter @forma-ui/commands test
```
