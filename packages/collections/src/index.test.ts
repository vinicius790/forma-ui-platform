import { describe, expect, it } from 'vitest';
import { ListCollection, SelectionManager, TreeCollection } from '@forma-ui/core';

describe('ListCollection', () => {
  it('keeps stable keys and skips disabled items during navigation', () => {
    const collection = new ListCollection([
      { key: 'a', value: 'Alpha', textValue: 'Alpha' },
      { key: 'b', value: 'Beta', textValue: 'Beta', disabled: true },
      { key: 'c', value: 'Café', textValue: 'Café' },
    ]);
    expect(collection.getKeyAfter('a')).toBe('c');
    expect(collection.getKeyAfter('c', true)).toBe('a');
    expect(collection.getKeyForSearch('cafe', 'a')).toBe('c');
    expect(() => collection.setItems([{ key: 'x', value: 'One' }, { key: 'x', value: 'Two' }])).toThrow(/Duplicate/u);
    expect(collection.getItem('a')?.value).toBe('Alpha');
  });
});

describe('SelectionManager', () => {
  it('supports range, select-all, disabled items and collection replacement', () => {
    const collection = new ListCollection([
      { key: 'a', value: 'A' }, { key: 'b', value: 'B' },
      { key: 'c', value: 'C', disabled: true }, { key: 'd', value: 'D' },
    ]);
    const selection = new SelectionManager(collection, 'multiple');
    selection.select('a');
    selection.selectRange('d');
    expect([...selection.getSelection()]).toEqual(['a', 'b', 'd']);
    selection.selectAll();
    expect([...selection.getSelection()]).toEqual(['a', 'b', 'd']);
    selection.updateMode('single');
    expect(selection.getSelection().size).toBe(1);
    selection.updateCollection(new ListCollection([{ key: 'd', value: 'D' }]));
    expect([...selection.getSelection()]).toEqual([]);
  });
});

describe('TreeCollection', () => {
  it('flattens only expanded branches with correct ARIA hierarchy metadata', () => {
    const tree = new TreeCollection([
      { key: 'root', value: 'Root', children: [{ key: 'child', value: 'Child', children: [{ key: 'leaf', value: 'Leaf' }] }] },
      { key: 'other', value: 'Other' },
    ]);
    expect(tree.getVisibleKeys()).toEqual(['root', 'other']);
    tree.expand('root');
    expect(tree.getVisibleNodes().map((node) => [node.key, node.level, node.posInSet, node.setSize])).toEqual([
      ['root', 1, 1, 2], ['child', 2, 1, 1], ['other', 1, 2, 2],
    ]);
    tree.expand('child');
    expect(tree.getVisibleKeys()).toEqual(['root', 'child', 'leaf', 'other']);
    expect(() => new TreeCollection([{ key: 'x', value: 1 }, { key: 'x', value: 2 }])).toThrow(/unique/u);
  });
});
