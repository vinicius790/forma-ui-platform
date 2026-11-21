import { describe, expect, it } from 'vitest';
import { createRangeSelectionController, filterTreePreservingAncestors } from './index';

describe('collections v50 extensions', () => {
  it('filters nested trees while preserving ancestor chains without mutating inputs', () => {
    interface Node { id: string; label: string; children?: Node[] }
    const tree: Node[] = [
      {
        id: 'a',
        label: 'Engineering',
        children: [
          { id: 'a-1', label: 'Frontend', children: [{ id: 'a-1-1', label: 'A11y' }] },
          { id: 'a-2', label: 'Backend' },
        ],
      },
      { id: 'b', label: 'Sales' },
    ];

    const filtered = filterTreePreservingAncestors(tree, (node) => node.label === 'A11y');
    expect(filtered).toEqual([
      {
        id: 'a',
        label: 'Engineering',
        children: [
          { id: 'a-1', label: 'Frontend', children: [{ id: 'a-1-1', label: 'A11y' }] },
        ],
      },
    ]);
    expect(tree[0]?.children).toHaveLength(2);
  });

  it('supports single, toggle, Shift-range, selectAll, clear, and idempotent destroy', () => {
    const controller = createRangeSelectionController(['k1', 'k2', 'k3', 'k4', 'k5']);
    controller.selectSingle('k2');
    expect(controller.selectedKeys).toEqual(['k2']);
    expect(controller.anchorKey).toBe('k2');

    controller.selectRange('k4');
    expect(controller.selectedKeys).toEqual(['k2', 'k3', 'k4']);
    expect(controller.anchorKey).toBe('k2');

    controller.selectRange('k1');
    expect(controller.selectedKeys).toEqual(['k1', 'k2']);

    controller.toggle('k5');
    expect(controller.selectedKeys).toEqual(['k1', 'k2', 'k5']);
    controller.toggle('k2');
    expect(controller.selectedKeys).toEqual(['k1', 'k5']);

    controller.selectAll();
    expect(controller.selectedKeys).toEqual(['k1', 'k2', 'k3', 'k4', 'k5']);

    controller.clear();
    expect(controller.selectedKeys).toEqual([]);
    expect(controller.anchorKey).toBeNull();

    controller.destroy();
    controller.destroy();
    expect(() => controller.selectSingle('k1')).toThrow(/destroyed/u);
  });
});
