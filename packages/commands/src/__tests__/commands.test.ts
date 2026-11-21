import { describe, expect, it, vi } from 'vitest';
import { CommandPaletteController, filterCommands, scoreCommand } from '../index';

const items = [
  { id: 'settings', label: 'Open settings', keywords: ['preferences'] },
  { id: 'export', label: 'Export report', keywords: ['download'] },
  { id: 'disabled', label: 'Disabled action', disabled: true },
];

describe('command ranking', () => {
  it('ranks exact and prefix matches ahead of fuzzy matches', () => {
    expect(scoreCommand('settings', items[0]!)).toBeGreaterThan(scoreCommand('os', items[0]!));
    expect(filterCommands(items, 'pref').map((result) => result.item.id)).toEqual(['settings']);
  });

  it('normalizes accents and excludes disabled commands', () => {
    expect(filterCommands([{ id: 'cafe', label: 'Café' }], 'cafe')[0]?.item.id).toBe('cafe');
    expect(filterCommands(items, '').some((result) => result.item.id === 'disabled')).toBe(false);
  });
});

describe('CommandPaletteController', () => {
  it('supports keyboard navigation and reports active descendants', async () => {
    const controller = new CommandPaletteController({ id: 'global commands', items });
    controller.openPalette();
    const input = controller.getInputProps();
    expect(input.role).toBe('combobox');
    const event = (key: string) => ({ key, isComposing: false, preventDefault: vi.fn() }) as unknown as KeyboardEvent;
    input.onKeyDown(event('ArrowDown'));
    expect(controller.activeItem?.id).toBe('export');
    expect(controller.getSnapshot().activeIndex).toBe(1);
    input.onKeyDown(event('Home'));
    expect(controller.activeItem?.id).toBe('settings');
    await controller.select('settings');
    expect(controller.getSnapshot().open).toBe(false);
    expect(controller.getInputProps()['aria-controls']).not.toContain(' ');
    controller.destroy();
  });

  it('ignores a stale asynchronous result after a newer query', async () => {
    let resolveFirst!: (value: typeof items) => void;
    const provider = vi.fn((query: string, _signal: AbortSignal) => query === 'a'
      ? new Promise<typeof items>((resolve) => { resolveFirst = resolve; })
      : Promise.resolve([items[1]!])) as (query: string, signal: AbortSignal) => Promise<typeof items>;
    const controller = new CommandPaletteController({ items: [], onQueryChange: provider });
    const oldQuery = controller.setQuery('a');
    await controller.setQuery('rep');
    resolveFirst([items[0]!]);
    await oldQuery;
    expect(controller.getResults().map((result) => result.item.id)).toEqual(['export']);
    controller.destroy();
  });

  it('rejects duplicate command IDs before rendering duplicate option IDs', () => {
    expect(() => new CommandPaletteController({ items: [{ id: 'same', label: 'One' }, { id: 'same', label: 'Two' }] })).toThrow(/Duplicate command item ID/u);
  });

  it('creates safe stable IDs and refuses to select items outside the current result set', async () => {
    const controller = new CommandPaletteController({ id: 'comandos globais', items });
    expect(controller.getRootProps().id).not.toMatch(/\s/u);
    const foreign = { id: 'foreign', label: 'Foreign' };
    expect(await controller.select(foreign)).toBe(false);
    expect(controller.getItemProps(foreign)['aria-selected']).toBe(false);
    controller.destroy();
  });

  it('retains the palette when a command fails and exposes the error', async () => {
    const error = new Error('failed');
    const controller = new CommandPaletteController({ items: [{ id: 'fail', label: 'Fail', onSelect: () => { throw error; } }] });
    controller.openPalette();
    expect(await controller.select('fail')).toBe(false);
    expect(controller.getSnapshot().open).toBe(true);
    expect(controller.getSnapshot().error).toBe(error);
    controller.destroy();
  });
});
