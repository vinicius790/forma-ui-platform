import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createSliderController } from '../components/slider';
import { createPaginationController } from '../components/pagination';

describe('property-based invariants', () => {
  it('slider values always remain in bounds and on the step grid', () => {
    fc.assert(fc.property(
      fc.integer({ min: -1000, max: 1000 }),
      fc.integer({ min: 1, max: 1000 }),
      fc.integer({ min: 1, max: 50 }),
      fc.integer({ min: -5000, max: 5000 }),
      (min, span, step, candidate) => {
        const max = min + span;
        const slider = createSliderController({ min, max, step, defaultValue: min });
        slider.setValue(candidate);
        const actual = slider.values[0]!;
        expect(actual).toBeGreaterThanOrEqual(min);
        expect(actual).toBeLessThanOrEqual(max);
        const steps = (actual - min) / step;
        expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-8);
      },
    ), { numRuns: 500 });
  });

  it('pagination never reports a page outside the valid page range', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 500 }),
      fc.integer({ min: -500, max: 1000 }),
      (pageCount, requestedPage) => {
        const pagination = createPaginationController({ pageCount, defaultPage: requestedPage });
        if (pageCount === 0) expect(pagination.page).toBe(0);
        else {
          expect(pagination.page).toBeGreaterThanOrEqual(1);
          expect(pagination.page).toBeLessThanOrEqual(pageCount);
        }
        const items = pagination.getPageItems().filter((value): value is number => typeof value === 'number');
        expect(items.every((value) => value >= 1 && value <= pageCount)).toBe(true);
        expect(new Set(items).size).toBe(items.length);
      },
    ), { numRuns: 500 });
  });
});
