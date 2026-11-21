import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { addDays, compareISODate, parseISODate, toISODate } from '../index';

describe('date arithmetic properties', () => {
  it('adding N days then subtracting N days restores every valid generated date', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1900, max: 2099 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }),
      fc.integer({ min: -3650, max: 3650 }),
      (year, month, day, offset) => {
        const start = toISODate({ year, month, day });
        const end = addDays(start, offset);
        expect(addDays(end, -offset)).toBe(start);
        expect(Math.sign(compareISODate(end, start))).toBe(Math.sign(offset));
        expect(parseISODate(end)).not.toBeNull();
      },
    ), { numRuns: 500 });
  });
});
