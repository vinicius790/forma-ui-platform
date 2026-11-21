import { describe, expect, it } from 'vitest';
import { createMasonryVirtualizer, findActiveStickyIndex } from '../index';

describe('virtualization v50 extensions', () => {
  it('places items into the shortest lane, reflows on measure, and cleans up idempotently', () => {
    const masonry = createMasonryVirtualizer({
      count: 4,
      lanes: 2,
      estimateSize: 100,
      gap: 10,
      overscan: 0,
    });
    expect(masonry.totalSize).toBe(210);
    masonry.setViewport(0, 150);
    expect(masonry.getVirtualItems().map((item) => [item.index, item.lane, item.start, item.end])).toEqual([
      [0, 0, 0, 100],
      [1, 1, 0, 100],
      [2, 0, 110, 210],
      [3, 1, 110, 210],
    ]);

    masonry.measure(0, 300);
    expect(masonry.totalSize).toBe(320);
    expect(masonry.getItem(2)).toEqual({ index: 2, lane: 1, start: 110, end: 210, size: 100 });
    expect(masonry.getItem(3)).toEqual({ index: 3, lane: 1, start: 220, end: 320, size: 100 });

    masonry.destroy();
    masonry.destroy();
    expect(() => masonry.setViewport(0, 100)).toThrow(/destroyed/u);
  });

  it('resolves the active sticky header index via binary search', () => {
    const sticky = [0, 10, 25, 40];
    const getOffset = (index: number) => index * 50;
    expect(findActiveStickyIndex(sticky, -5, getOffset)).toBe(-1);
    expect(findActiveStickyIndex(sticky, 0, getOffset)).toBe(0);
    expect(findActiveStickyIndex(sticky, 499, getOffset)).toBe(0);
    expect(findActiveStickyIndex(sticky, 500, getOffset)).toBe(10);
    expect(findActiveStickyIndex(sticky, 2000, getOffset)).toBe(40);
    expect(findActiveStickyIndex([], 100, getOffset)).toBe(-1);
  });
});
