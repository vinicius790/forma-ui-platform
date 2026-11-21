import { describe, expect, it, vi } from 'vitest';
import { createVirtualizer } from '../index';
import fc from 'fast-check';

describe('virtualizer', () => {
  it('calculates an overscanned fixed-size window for large collections', () => {
    const virtualizer = createVirtualizer({ count: 100_000, estimateSize: 20, overscan: 2 });
    virtualizer.setViewport(1_000, 100);
    const items = virtualizer.getVirtualItems();
    expect(items[0]?.index).toBeLessThanOrEqual(48);
    expect(items.at(-1)?.index).toBeGreaterThanOrEqual(57);
    expect(virtualizer.totalSize).toBe(2_000_000);
  });
  it('updates variable measured sizes and computes stable offsets', () => {
    const virtualizer = createVirtualizer({ count: 4, estimateSize: (index) => 10 + index });
    expect(virtualizer.getOffsetForIndex(3)).toBe(33);
    virtualizer.measure(1, 50);
    expect(virtualizer.getOffsetForIndex(2)).toBe(60);
    expect(virtualizer.totalSize).toBe(85);
  });
  it('supports gaps, horizontal mode and alignments', () => {
    const virtualizer = createVirtualizer({ count: 10, estimateSize: 10, gap: 2, horizontal: true });
    virtualizer.setViewport(20, 20);
    expect(virtualizer.scrollToIndex(5, 'start')).toBe(60);
    const element = document.createElement('div');
    Object.defineProperties(element, { scrollLeft: { value: 15, configurable: true }, clientWidth: { value: 100, configurable: true }, scrollTop: { value: 0, configurable: true }, clientHeight: { value: 100, configurable: true } });
    const scrollTo = vi.fn();
    element.scrollTo = scrollTo;
    const cleanup = virtualizer.attach(element);
    virtualizer.scrollToOffset(45);
    expect(scrollTo).toHaveBeenCalledWith({ left: 45, behavior: 'auto' });
    cleanup();
    virtualizer.destroy();
  });
  it('normalizes non-finite indexes and offsets and rejects mutation after destroy', () => {
    const virtualizer = createVirtualizer({ count: 3, estimateSize: 10 });
    expect(virtualizer.getOffsetForIndex(Number.NaN)).toBe(0);
    expect(virtualizer.scrollToIndex(Number.NaN, 'start')).toBe(0);
    virtualizer.measure(Number.NaN, 20);
    virtualizer.destroy();
    expect(() => virtualizer.setViewport(0, 10)).toThrow(/destroyed/u);
    expect(() => virtualizer.attach(document.createElement('div'))).toThrow(/destroyed/u);
  });

  it('validates variable size estimates lazily for every requested index', () => {
    expect(() => createVirtualizer({ count: 3, estimateSize: (index) => index === 2 ? Number.NaN : 10 })).toThrow(/estimateSize\(2\)/u);
    const virtualizer = createVirtualizer({ count: 3, estimateSize: 10 });
    expect(() => virtualizer.updateOptions({ estimateSize: (index) => index === 1 ? Number.POSITIVE_INFINITY : 5 })).toThrow(/estimateSize\(1\)/u);
    expect(virtualizer.totalSize).toBe(30);
    virtualizer.destroy();
  });

  it('notifies subscribers when viewport or measurements change', () => {
    const virtualizer = createVirtualizer({ count: 2, estimateSize: 10 });
    const listener = vi.fn();
    virtualizer.subscribe(listener);
    virtualizer.setViewport(0, 20);
    virtualizer.measure(0, 12);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});


describe('virtualizer properties', () => {
  it('keeps item offsets ordered and total size equal to measured sizes plus gaps', () => {
    fc.assert(fc.property(
      fc.array(fc.integer({ min: 1, max: 120 }), { minLength: 1, maxLength: 80 }),
      fc.integer({ min: 0, max: 8 }),
      (sizes, gap) => {
        const virtualizer = createVirtualizer({ count: sizes.length, estimateSize: 20, gap, overscan: 0 });
        sizes.forEach((size, index) => virtualizer.measure(index, size));
        virtualizer.setViewport(0, 100_000);
        const items = virtualizer.getVirtualItems();
        expect(items.map((item) => item.index)).toEqual(sizes.map((_, index) => index));
        for (let index = 1; index < items.length; index += 1) {
          expect(items[index]!.start).toBeGreaterThanOrEqual(items[index - 1]!.end);
        }
        expect(virtualizer.totalSize).toBe(sizes.reduce((sum, value) => sum + value, 0) + (sizes.length - 1) * gap);
        virtualizer.destroy();
      },
    ), { numRuns: 200 });
  });
});
