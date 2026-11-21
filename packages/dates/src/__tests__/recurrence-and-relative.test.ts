import { describe, expect, it } from 'vitest';
import {
  diffISODates,
  expandRecurrence,
  formatRelativeDays,
  getMultiMonthGrids,
} from '../index';

describe('dates v50 extensions', () => {
  it('expands daily, weekly byWeekday, monthly, and yearly recurrences deterministically', () => {
    expect(expandRecurrence({ start: '2026-01-01', freq: 'daily', interval: 2, count: 3 })).toEqual([
      '2026-01-01',
      '2026-01-03',
      '2026-01-05',
    ]);
    expect(
      expandRecurrence({ start: '2026-01-07', freq: 'weekly', interval: 2, byWeekday: [1, 3, 5], count: 4 }),
    ).toEqual(['2026-01-07', '2026-01-09', '2026-01-19', '2026-01-21']);
    expect(expandRecurrence({ start: '2026-01-31', freq: 'monthly', count: 3 })).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);
    expect(expandRecurrence({ start: '2024-02-29', freq: 'yearly', until: '2028-03-01' })).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ]);
  });

  it('generates adjacent multi-month calendar grids across year boundaries', () => {
    const grids = getMultiMonthGrids('2026-11-10', 3, { fixedWeeks: true });
    expect(grids.map((g) => g.month)).toEqual(['2026-11-01', '2026-12-01', '2027-01-01']);
    expect(grids.every((g) => g.weeks.length === 6)).toBe(true);
  });

  it('computes signed ISO date differences and formats relative days', () => {
    expect(diffISODates('2024-03-01', '2024-02-28')).toBe(2);
    expect(diffISODates('2026-01-01', '2026-01-06')).toBe(-5);
    expect(diffISODates('2026-05-01', '2026-05-01')).toBe(0);
    expect(formatRelativeDays(0, 'en')).toBe('today');
    expect(formatRelativeDays(1, 'en')).toBe('tomorrow');
    expect(formatRelativeDays(-1, 'en')).toBe('yesterday');
  });
});
